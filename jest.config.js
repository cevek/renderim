module.exports = {
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    moduleNameMapper: {
        renderim: '<rootDir>/dist/backend.js',
    },
    globals: {
        'ts-jest': {
            tsConfig: './tests/tsconfig.json',
        },
    },
};
