
function extractFilePaths(diffContent) {
    const filePaths = [];
    const lines = diffContent.split('\n');

    lines.forEach(line => {
        // Match lines that start with "diff --git a/... b/..."
        const match = line.match(/^diff --git a\/(.+?) b\/(.+?)$/);
        if (match) {
            filePaths.push(match[1]); // Capture file path after 'a/' prefix
        }
    });

    return filePaths;
}

// Example usage in exec
const exec = async (req, action) => {
    const diffStep = action.steps.find((s) => s.stepName === 'diff');
    
    if (diffStep && diffStep.content) {
        console.log('Diff content:', diffStep.content);

        // Use the new function to extract file paths
        const filePaths = extractFilePaths(diffStep.content);
        
        if (filePaths.length > 0) {
            console.log('Changed file paths:', filePaths);
        } else {
            console.log('No file paths provided in the diff step.');
        }
    } else {
        console.log('No diff content available.');
    }
    return action; // Returning action for testing purposes
};

exec.displayName = 'SecretDetection.exec';
exports.exec = exec;
exports.extractFilePaths = extractFilePaths;
