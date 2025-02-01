module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    moduleDirectories: [
        '/home/k3vwd/work/aws-solutions-architect/serverlessPatterns/node_modules/',
        '/home/k3vwd/work/aws-solutions-architect/serverlessPatterns/assets/node_modules/',
    ],
};
