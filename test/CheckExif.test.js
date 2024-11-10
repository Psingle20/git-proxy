// const path = require('path');
const { exec } = require('../src/proxy/processors/push-action/checkExifJpeg.js'); // Adjust path as necessary
const sinon = require('sinon');
const {Action} = require('../src/proxy/actions/Action.js')
const {Step} = require('../src/proxy/actions/Step.js')
const fs = require('fs').promises;
const path = require('path');

describe('Check EXIF Data From Images', () => {
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

    const createDiffContentForFolder = async (folderPath) => {
        const filePaths = [];
        
        // Recursively read all files in the folder and subfolders
        const readFolder = async (dir) => {
            const entries = await fs.readdir(dir, { withFileTypes: true }); // Get directory entries
            // Process each directory entry
            for (const entry of entries) {
                let fullPath = path.join(dir, entry.name);
        
                if (entry.isDirectory()) {
                    // Recursively process subdirectories
                    await readFolder(fullPath);
                } else {
                    // Add file path to diff content
                    fullPath = fullPath.replace(/\\/g, '/');
                    filePaths.push(`diff --git a/${fullPath} b/${fullPath}`);
                }
            }
        };
    
        // Start reading the folder
        await readFolder(folderPath);
        // Join the array of diff entries with a newline character to ensure proper line breaks
        const diffContent = filePaths.join('\n');
        return diffContent;
    };
    

    it('Should block push when sensitive EXIF metadata found', async () => {
        const action = new Action('action_id', 'push', 'create', Date.now(), 'owner/repo');
        const step = new Step('diff');

        // Create diff content simulating sensitive data in CSV
        step.setContent(createDiffContent(['test/test_data/jpg/Canon_PowerShot_S40.jpg']));
        action.addStep(step);
     
        await exec(null, action);
        sinon.assert.calledWith(logStub, sinon.match(/Your push has been blocked due to sensitive EXIF metadata detection in an image/));
    });

    it('Should allow push when no sensitive EXIF metadata found', async () => {
      
        const action = new Action('action_id', 'push', 'create', Date.now(), 'owner/repo');
        const step = new Step('diff');
        step.setContent(createDiffContent(['test/test_data/jpg/Reconyx_HC500_Hyperfire.jpg']));
        action.addStep(step);
        await exec(null, action);
        sinon.assert.neverCalledWith(logStub, sinon.match(/Your push has been blocked due to sensitive EXIF metadata detection in an image/));
    });

});