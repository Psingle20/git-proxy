const { exec } = require('../src/proxy/processors/push-action/SecretsDetection'); // Adjust the path to your exec file
const { Step } = require('../src/proxy/actions/Step'); // Import Step if needed
const sinon = require('sinon');

describe('exec function', () => {
    let logStub;

    beforeEach(() => {
        // Create a stub for console.log
        logStub = sinon.stub(console, 'log');
    });

    afterEach(() => {
        // Restore the original console.log
        logStub.restore();
    });

    it('should log changed file paths when diffStep has content', async () => {
        const action = {
            steps: [
                new Step('diff', false, null, false, null, 'file1.js\nfile2.js\nfile3.js')
            ]
        };
        const req = {};
        await exec(req, action);

        // Print what is being logged for debugging
        console.log('Logged output for changed file paths:', logStub.getCalls().map(call => call.args));

        // Check the logged output
        sinon.assert.calledWith(logStub.getCall(0), 'Diff content:', 'file1.js\nfile2.js\nfile3.js');
        sinon.assert.calledWith(logStub.getCall(1), 'Changed file paths:');
        sinon.assert.calledWith(logStub.getCall(2), 'file1.js');
        sinon.assert.calledWith(logStub.getCall(3), 'file2.js');
        sinon.assert.calledWith(logStub.getCall(4), 'file3.js');
    });

    it('should log a message when no file paths are provided in the diff step', async () => {
        const action = {
            steps: [
                new Step('diff', false, null, false, null, '') // Empty content
            ]
        };
        const req = {};
        await exec(req, action);

        // Print what is being logged for debugging
        console.log('Logged output for no file paths:', logStub.getCalls().map(call => call.args));

        // Check the logged output
        sinon.assert.calledWith(logStub.getCall(0), 'Diff content:', ''); // Ensure it logs the empty content
        sinon.assert.calledWith(logStub.getCall(1), 'No file paths provided in the diff step.'); // Check for no paths message
    });

    it('should log a message when no diff content is available', async () => {
        const action = {
            steps: [] // No steps
        };
        const req = {};
        await exec(req, action);

        // Print what is being logged for debugging
        console.log('Logged output for no diff content:', logStub.getCalls().map(call => call.args));

        // Check the logged output
        sinon.assert.calledWith(logStub.getCall(0), 'No diff content available.'); // Ensure it logs the correct message
    });
});
