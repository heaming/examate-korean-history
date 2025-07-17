export abstract class BaseNativeBridge {
  private webViewRef: any = null;
  private messageId = 0;

  setWebViewRef(webViewRef: any) {
    this.webViewRef = webViewRef;
  }

  // 웹뷰로 메시지 전송
  protected postMessage(message: any) {
    if (this.webViewRef) {
      this.webViewRef.postMessage(JSON.stringify(message));
    }
  }

  // 성공 응답 전송
  protected sendSuccess(id: string, type: string, data: any) {
    this.postMessage({
      type,
      id,
      data
    });
  }

  // 에러 응답 전송
  protected sendError(id: string, type: string, error: string) {
    this.postMessage({
      type,
      id,
      error
    });
  }

  // 요청 처리 및 응답 전송
  async processRequest(message: any) {
    const { type, data, id } = message;

    try {

      const result = await this.handleMessage(type, data); // id 제외하고 전달
      this.sendSuccess(id, type, result);

    } catch (error: any) {
      this.sendError(id, type, error.message);
    }
  }

  abstract handleMessage(type: string, data?: any): Promise<any>;
  abstract getSupportedMessageTypes(): string[];
}