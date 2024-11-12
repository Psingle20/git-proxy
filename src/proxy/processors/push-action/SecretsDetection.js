const { Step } = require('../../actions');
const { exec: cexec } = require('child_process');
const path = require('path');

// Function to extract relevant file paths from Git diff content
function extractRelevantFilePaths(diffContent) {
  const relevantFilePaths = [];
  const lines = diffContent.split('\n');

  // Define relevant file extensions for secret/malicious code detection
  const relevantExtensions = ['.env', '.json', '.yaml', '.yml', '.js', '.ts', '.txt'];

  lines.forEach((line) => {
    // Match lines that start with "diff --git a/... b/..."
    const match = line.match(/^diff --git a\/(.+?) b\/(.+?)$/);
    if (match) {
      const filePath = match[1]; // Capture file path after 'a/' prefix
      const fileExtension = filePath.split('.').pop(); // Get file extension

      // Check if the file has a relevant extension
      if (relevantExtensions.includes(`.${fileExtension}`)) {
        relevantFilePaths.push(filePath); // Add to relevant file paths
      }
    }
  });

  return relevantFilePaths;
}

function runGitleaks(filePaths) {
  return new Promise((resolve, reject) => {
    // Create the command string with multiple --source arguments
    // const filesToCheck = filePaths.map((filePath) => `--source="${filePath}"`).join(' '); // Ensure each file path gets its own --source
    const filesToCheck = filePaths
      .map((filePath) => {
        // Convert each file path to an absolute path and normalize slashes
        const formattedFilePath = `--source="${path.resolve(filePath).replace(/\\/g, '/')}"`;
        return formattedFilePath;
      })
      .join(' ');

    console.log('Files to check:', filesToCheck);

    // Use an absolute path for the gitleaks configuration file
    const configPath = path.resolve(__dirname, '../../../../gitleaks.toml'); // Adjust path as needed

    // Construct the command without extra escape characters
    const command = `gitleaks detect ${filesToCheck} --no-git --config="${configPath}"`;

    console.log(`Executing Gitleaks Command: ${command}`); // Log the command being executed

    // Execute the command using Node.js exec
    cexec(command, (error, stdout, stderr) => {
        console.log('Gitleaks command executed');
        console.log({ error, stdout, stderr });
      
        if (error) {
          console.error(`Error executing gitleaks: ${error.message}`);
          reject(new Error(`Error executing gitleaks: ${error.message}`)); // Reject with an Error object
        } else if (stderr) {
          console.error(`stderr: ${stderr}`);
          reject(new Error(`stderr: ${stderr}`)); // Reject with an Error object
        } else {
          console.log('hi');
          console.log(`stdout: ${stdout}`);
          resolve(stdout); // Resolve with the output from gitleaks
        }
      });
      
  });
}

// Function to check if any sensitive secrets were found
function checkForSensitiveSecrets(output) {
  try {
    const findings = JSON.parse(output); // Parse the JSON output from Gitleaks

    // Check if any secrets are found
    if (findings.length > 0) {
      // If any secrets were found, return true (indicating sensitive data was detected)
      findings.forEach((finding) => {
        // Log the details of each detected secret
        console.log(`Secret found in file: ${finding.file}`);
        console.log(`  Rule: ${finding.rule_id}`);
        console.log(`  Secret: ${finding.secret}`);
        console.log(`  Line: ${finding.line_number}`);
        console.log('-----------------------------');
      });
      return true;
    }
    return false; // No sensitive data found
  } catch (error) {
    console.error('Error parsing Gitleaks output:', error);
    return false; // Return false if there's an error in parsing
  }
}

// Example usage in exec function
const exec = async (req, action) => {
  const diffStep = action.steps.find((s) => s.stepName === 'diff');
  const step = new Step('secretsDetection');

  if (diffStep && diffStep.content) {
    console.log('Diff content:', diffStep.content);

    // Use the function to extract file paths
    const filePaths = extractRelevantFilePaths(diffStep.content);

    if (filePaths.length > 0) {
      console.log('Changed file paths:', filePaths);

      // Run Gitleaks on the file paths
      try {
        const result = await runGitleaks(filePaths);
        console.log('Gitleaks output:', result);

        // Check if sensitive secrets were detected
        const hasSensitiveSecrets = checkForSensitiveSecrets(result);

        if (hasSensitiveSecrets) {
          step.error = true;
          step.log('Sensitive secrets detected in the diff.');
          step.setError(
            '\n\n\n\nYour push has been blocked.\nPlease ensure your code does not contain sensitive information or URLs.\n\n\n',
          );
          step.blocked = true;
          step.blockedMessage = 'Sensitive secrets detected in the diff.';
          action.addStep(step);
        } else {
          console.log('No sensitive secrets detected.');
        }
      } catch (err) {
        console.error('Error during Gitleaks execution:', err);
      }
    } else {
      console.log('No relevant file paths found in the diff.');
    }
  } else {
    console.log('No diff content available.');
  }

  return action; // Returning action for testing purposes
};

exec.displayName = 'SecretDetection.exec'; // For debugging or tracking
exports.exec = exec;
// process.chdir('C:/Users/ingle/Desktop/Citi Hackthon/git-proxy'); // Adjust path as needed
// console.log('Current working directory:', process.cwd());

// let diffContent =
//   'diff --git a/test/test_data/SecretDetectTestData/sensitive_data.js b/test/test_data/SecretDetectTestData/sensitive_data.js\\ndiff --git a/test/test_data/SecretDetectTestData/another_file.txt b/test/test_data/SecretDetectTestData/another_file.txt';
// let arr = extractRelevantFilePaths(diffContent);
// console.log(arr);
// runGitleaks(arr);
