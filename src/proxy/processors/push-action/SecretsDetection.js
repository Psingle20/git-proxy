const { spawn } = require('child_process');
const path = require('path');
const config = require('../../../config');
const commitConfig = config.getCommitConfig();


// go to proxyconfig.json and enable the feature

// gitleaks.report.json will show the secrets found and in which file they are found
// Function to extract relevant file paths and their parent directories
function extractRelevantDirectories(diffContent) {
  const relevantDirectories = [];
  const lines = diffContent.split('\n');
  // .env is mostly in the gitignore but it can be added here as well
  const relevantExtensions = [ '.json', '.yaml', '.yml', '.js', '.ts', '.txt'];

  lines.forEach((line) => {
    const match = line.match(/^diff --git a\/(.+?) b\/(.+?)$/);
    if (match) {
      const filePath = match[1];
      const fileExtension = filePath.split('.').pop();

      if (relevantExtensions.includes(`.${fileExtension}`)) {
        // Extract parent directory from file path
        const dirPath = path.dirname(filePath);
        if (!relevantDirectories.includes(dirPath)) {
          relevantDirectories.push(dirPath);
        }
      }
    }
  });

  return relevantDirectories;
}

// Function to run gitleaks with directory paths
function runGitleaks(filePaths) {
  return new Promise((resolve, reject) => {
    const filesToCheck = filePaths
      .map((filePath) => `"${path.resolve(filePath).replace(/\\/g, '/')}"`) // Ensure files are correctly quoted
      .join(' ');

    const configPath = path.resolve(__dirname, '../../../../gitleaks.toml').replace(/\\/g, '/');
    const reportPath = path.resolve(__dirname, '../../../../gitleaks_report.json').replace(/\\/g, '/');

    // Log the full command for debugging
    const command = `gitleaks dir ${filesToCheck} --config="${configPath}" --report-format json --log-level error --report-path="${reportPath}"`;
    console.log(`Executing Gitleaks Command: ${command}`);  // Log the full command for debugging

    const gitleaksProcess = spawn('gitleaks', ['dir', ...filePaths, '--config', configPath, '--report-format', 'json', '--log-level', 'error', '--report-path', reportPath]);

    gitleaksProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    gitleaksProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    gitleaksProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Gitleaks failed with exit code ${code}`));
      } else {
        resolve('Gitleaks executed successfully');
      }
    });
  });
}


// Function to check for sensitive secrets in the Gitleaks output
function checkForSensitiveSecrets(output) {
  try {
    const findings = JSON.parse(output);

    if (findings.length > 0) {
      findings.forEach((finding) => {
        console.log(`Secret found in file: ${finding.file}`);
        console.log(`  Rule: ${finding.rule_id}`);
        console.log(`  Secret: ${finding.secret}`);
        console.log(`  Line: ${finding.line_number}`);
        console.log('-----------------------------');
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error parsing Gitleaks output:', error);
    return false;
  }
}

// Example usage in exec function
const exec = async (req, action) => {
  const diffStep = action.steps.find((s) => s.stepName === 'diff');
  const step = new Step('secretsDetection');
  const commitinfo = commitConfig.SecretDetect;
  if(!commitinfo.enabled){
    action.addStep(step);
    return action;
  }


  if (diffStep && diffStep.content) {
    console.log('Diff content:', diffStep.content);

    const dirPaths = extractRelevantDirectories(diffStep.content);

    if (dirPaths.length > 0) {
      console.log('Changed directories:', dirPaths);

      try {
        const result = await runGitleaks(dirPaths);
        console.log("Gitleaks output:", result);

        const hasSensitiveSecrets = checkForSensitiveSecrets(result);

        if (hasSensitiveSecrets) {
          step.error = true;
          step.log('Sensitive secrets detected in the diff.');
          step.setError(
            '\n\n\n\nYour push has been blocked.\nPlease ensure your code does not contain sensitive information or URLs.\n\n\n',
          );
          step.blocked = true;
          step.blockedMessage = 'Sensitive secrets detected in the diff.';
          console.log('Sensitive secrets detected! Push blocked.');
          action.addStep(step);
        } else {
          console.log('No sensitive secrets detected.');
        }
      } catch (err) {
        console.error('Error during Gitleaks execution:', err);
      }
    } else {
      console.log('No relevant directories found in the diff.');
    }
  } else {
    console.log('No diff content available.');
  }

  return action;
};

exec.displayName = 'SecretDetection.exec';
exports.exec = exec;

// for testing purpose
// const diffContent ="diff --git a/test/test_data/SecretDetectTestData/sensitive_data.js b/test/test_data/SecretDetectTestData/sensitive_data.js"

// const reldirs = extractRelevantDirectories(diffContent);
// console.log('Changed file paths:', reldirs);

// runGitleaks(reldirs).then((result) => {
//   console.log("Gitleaks output:", result);
//   const hasSensitiveSecrets = checkForSensitiveSecrets(result);
//   if (hasSensitiveSecrets) {
//     console.log('Sensitive secrets detected! Push blocked.');
//   } else {  
//     console.log('No sensitive secrets detected.');
//   }     
// }).catch((error) => {
//   console.error('Error during Gitleaks execution:', error);
// });