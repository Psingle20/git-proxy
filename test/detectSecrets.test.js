
const { exec } = require('../src/proxy/processors/push-action/SecretsDetection.js'); // Adjust the path
const sinon = require('sinon');
const { Action } = require('../src/proxy/actions/Action.js');
const { Step } = require('../src/proxy/actions/Step.js');

describe('Sensitive Data Detection', () => {
    let logStub;

    beforeEach(() => {
        logStub = sinon.stub(console, 'log'); // Stub console.log before each test
    });

    afterEach(() => {
        logStub.restore(); // Restore console.log after each test
    });

    const createDiffContent = (filePaths) => {
        // Format file paths in diff format
        return filePaths.map(filePath => `diff --git a/${filePath} b/${filePath}`).join('\n');
    };

    

   
    it('should detect sensitive data and log the appropriate message', async () => {
       
      

        const action = new Action('action_id', 'push', 'create', Date.now(), 'owner/repo');
        const step = new Step('diff');

        // Create diff content simulating sensitive data in the dummy file
        step.setContent(createDiffContent(['test/test_data/SecretDetectTestData/sensitive_data.js' ]));
        action.addStep(step);

        // Call the real exec function (without mocking) here
        await exec(null, action); // Run your real exec function

        // Check if the correct log was triggered based on the actual execution
        sinon.assert.calledWith(logStub, sinon.match(/Sensitive secrets detected! Push blocked/)); // Ensure the detection log
        sinon.assert.calledWith(logStub, sinon.match(/File: test\/test_data\/sensitive_data.js/)); // Ensure the file with the secret is logged
        sinon.assert.calledWith(logStub, sinon.match(/Secret: AKIA[A-Za-z0-9]{16}/)); // Ensure the secret pattern is logged

      
    });
});
