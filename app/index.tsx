import { useEffect, useRef, useState } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { DatabaseAdapter } from '../src/database/DatabaseAdapter';
import { BridgeManager } from '../src/native/BridgeManager';

export default function HomeScreen() {
  const webViewRef = useRef<WebView>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [bridgeManager, setBridgeManager] = useState<BridgeManager | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Starting database initialization...');
      await DatabaseAdapter.getInstance().initialize();
      console.log('Database initialized successfully');
      setIsDbReady(true);

      console.log('Creating BridgeManager...');
      const manager = BridgeManager.getInstance();
      setBridgeManager(manager);
      console.log('BridgeManager created successfully');
      console.log('Supported message types:', manager.getSupportedMessageTypes());
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  // WebView 참조를 BridgeManager에 설정
  useEffect(() => {
    if (bridgeManager && webViewRef.current) {
      bridgeManager.setWebViewRef(webViewRef.current);
    }
  }, [bridgeManager, webViewRef.current]);

  const handleMessage = async (event: any) => {
    if (!bridgeManager) return;

    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('Received message from WebView:', message);

      // BridgeManager가 자동으로 적절한 브릿지로 라우팅하고 응답 전송
      await bridgeManager.handleMessage(message);

    } catch (error) {
      console.error('Error handling message:', error);

      // 에러 응답을 WebView로 전송
      if (webViewRef.current) {
        try {
          const originalMessage = JSON.parse(event.nativeEvent.data);
          const errorResponse = {
            id: originalMessage.id,
            type: originalMessage.type,
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false
          };

          webViewRef.current.postMessage(JSON.stringify(errorResponse));
        } catch (parseError) {
          console.error('Failed to parse original message for error response:', parseError);
        }
      }
    }
  };

  // Android 에뮬레이터에서는 10.0.2.2가 호스트 PC의 localhost를 가리킴
  // Expo 환경에서는 실제 PC IP 주소 사용
  const webViewUrl = Platform.OS === 'android' 
    ? 'http://192.168.200.162:3000'  // 현재 PC IP 주소
    : 'http://localhost:3000';

  return (
    <View style={[styles.container, { 
      // paddingTop: insets.top,
      // paddingBottom: insets.bottom,
      // paddingLeft: insets.left,
      // paddingRight: insets.right,
    }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WebView
        ref={webViewRef}
        source={{ uri: webViewUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        cacheEnabled={true}
        allowsLinkPreview={false}
        scrollEnabled={true}
        scalesPageToFit={true}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onLoadStart={() => {
          console.log('WebView load started:', webViewUrl);
        }}
        onLoadEnd={() => {
          console.log('WebView load ended successfully');
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error:', nativeEvent);
        }}
        onMessage={handleMessage}
        // 웹 콘텐츠에 적절한 패딩 적용
        injectedJavaScript={`
          // 웹 콘텐츠에 적절한 패딩 적용
          const style = document.createElement('style');
          style.innerHTML = \`
            body {
            }
            
            /* 컨테이너 요소들에 적절한 여백 */
            .container, .main-content, .app {
            }
            
            /* 하단 탭/버튼 영역 보호 */
            .bottom-navigation, .tab-container, .footer, 
            [class*="bottom"], [class*="tab"], [class*="navigation"] {
            }
            
            /* 모바일 최적화 */
            * {
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              -khtml-user-select: none;
              -moz-user-select: none;
              -ms-user-select: none;
              user-select: none;
            }
            
            input, textarea, [contenteditable] {
              -webkit-user-select: text !important;
              -khtml-user-select: text !important;
              -moz-user-select: text !important;
              -ms-user-select: text !important;
              user-select: text !important;
            }
          \`;
          document.head.appendChild(style);
          
          // 데이터베이스 준비 상태를 웹뷰에 알림
          window.isNativeDbReady = ${isDbReady};
          console.log('Native DB Ready:', ${isDbReady});
          console.log('WebView URL:', '${webViewUrl}');
          console.log('Safe Area Insets:', ${JSON.stringify(insets)});
          
          true;
        `}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
}); 