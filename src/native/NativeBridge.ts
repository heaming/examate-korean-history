import { NativeMessage } from '../types';
import { MessageHandler } from './MessageHandler';

export class NativeBridge {
  private messageHandler: MessageHandler;

  constructor() {
    this.messageHandler = new MessageHandler();
  }

  async handleMessage(message: NativeMessage): Promise<any> {
    try {
      console.log('Handling message:', message.type, message.data);
      return await this.messageHandler.handle(message);
    } catch (error) {
      console.error('Error handling message:', error);
      throw error;
    }
  }
}