import { useEffect, useRef, useState } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { NativeBridge } from '../src/native/NativeBridge';

export default function HomeScreen() {
  const webViewRef = useRef<WebView>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [nativeBridge, setNativeBridge] = useState<NativeBridge | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Starting database initialization...');
      await DatabaseManager.getInstance().initialize();
      console.log('Database initialized successfully');
      setIsDbReady(true);
      
      console.log('Creating NativeBridge...');
      const bridge = new NativeBridge();
      setNativeBridge(bridge);
      console.log('NativeBridge created successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  const handleMessage = async (event: any) => {
    if (!nativeBridge) return;
    
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('Received message from WebView:', message);
      
      const result = await nativeBridge.handleMessage(message);
      
      // 결과를 WebView로 전송
      if (webViewRef.current) {
        const response = {
          id: message.id,
          type: message.type,
          data: result,
          success: true
        };
        
        webViewRef.current.postMessage(JSON.stringify(response));
      }
    } catch (error) {
      console.error('Error handling message:', error);
      
      // 에러 응답을 WebView로 전송
      if (webViewRef.current) {
        const errorResponse = {
          id: JSON.parse(event.nativeEvent.data).id,
          type: JSON.parse(event.nativeEvent.data).type,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        };
        
        webViewRef.current.postMessage(JSON.stringify(errorResponse));
      }
    }
  };

  // 웹 플랫폼에서는 iframe 사용, 모바일에서는 WebView 사용
  if (Platform.OS === 'web') {
    return (
      <iframe
        src="http://localhost:3000"
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
        }}
        title="Web Content"
      />
    );
  }

  // Android 에뮬레이터에서는 10.0.2.2가 호스트 PC의 localhost를 가리킴
  // Expo 환경에서는 실제 PC IP 주소 사용
  const webViewUrl = Platform.OS === 'android' 
    ? 'http://192.168.200.162:3000'  // 현재 PC IP 주소
    : 'http://localhost:3000';

  return (
    <View style={[styles.container, { 
      paddingTop: insets.top, // 상단은 Safe Area만
      paddingBottom: insets.bottom + 10, // 하단은 최소한만
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WebView
        ref={webViewRef}
        source={{ uri: webViewUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        // 성능 최적화 설정
        cacheEnabled={true}
        allowsLinkPreview={false}
        // 스크롤 및 줌 설정
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
              padding-top: 10px !important;
              padding-bottom: 20px !important;
              padding-left: 8px !important;
              padding-right: 8px !important;
              margin: 0 !important;
              box-sizing: border-box !important;
            }
            
            /* 컨테이너 요소들에 적절한 여백 */
            .container, .main-content, .app {
              padding-top: 5px !important;
              padding-bottom: 15px !important;
            }
            
            /* 하단 탭/버튼 영역 보호 */
            .bottom-navigation, .tab-container, .footer, 
            [class*="bottom"], [class*="tab"], [class*="navigation"] {
              margin-bottom: 15px !important;
              padding-bottom: 10px !important;
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