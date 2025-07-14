const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 웹 환경에서 파일 별칭 설정
config.resolver.alias = {
  './DatabaseManager': './DatabaseManager.web',
};

// 웹 환경에서 expo-sqlite 제외
config.resolver.platforms = ['web', 'ios', 'android'];

// 웹 플랫폼에서 특정 모듈 제외
config.resolver.resolverMainFields = ['browser', 'main'];

// 웹에서 expo-sqlite 관련 파일들을 제외
config.resolver.blockList = [
  /node_modules\/expo-sqlite\/web\/.*/,
];

module.exports = config; 