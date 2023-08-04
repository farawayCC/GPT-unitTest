export default {
    testEnvironment: 'node', // Use Node.js test environment
    transform: {}, // Disable Jest transformations to allow ESM
    globals: {
        'ts-jest': {
            useESM: true, // Tell ts-jest to use ESM
        },
    },
};