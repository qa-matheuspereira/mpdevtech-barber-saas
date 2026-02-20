/**
 * Cliente HTTP para WPPConnect Server
 * Comunica com o container Docker do WPPConnect via API REST
 * Com fallback para desenvolvimento local
 */

const WPPCONNECT_API_URL = process.env.WPPCONNECT_API_URL || "http://localhost:3333";
const USE_MOCK = process.env.USE_MOCK_WHATSAPP === "true" || process.env.NODE_ENV === "development";

export interface WPPConnectSession {
  sessionName: string;
  phoneNumber?: string;
  qrCode?: string;
  status: "pending" | "connected" | "error" | "disconnected";
  isActive: boolean;
}

/**
 * Gerar QR Code fake para desenvolvimento
 */
function generateMockQRCode(): string {
  // Retorna um QR Code placeholder em base64
  return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0id2hpdGUiLz48dGV4dCB4PSI1MCIgeT0iMTAwIiBmb250LXNpemU9IjE2IiBmaWxsPSJibGFjayI+UVIgQ29kZSBNb2NrPC90ZXh0Pjwvc3ZnPg==";
}

/**
 * Tentar conectar ao WPPConnect com retry
 */
async function tryConnectWPPConnect(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error("Falha ao conectar ao WPPConnect após múltiplas tentativas");
}

/**
 * Criar nova sessão WhatsApp
 */
export async function initializeSession(
  sessionName: string
): Promise<{ qrCode: string; sessionName: string }> {
  try {
    console.log(`[WPPConnect API] Iniciando sessão: ${sessionName}`);

    // Se estiver em modo mock, retornar QR Code fake
    if (USE_MOCK) {
      console.warn(`[WPPConnect API] Usando modo MOCK para desenvolvimento`);
      return {
        qrCode: generateMockQRCode(),
        sessionName: sessionName,
      };
    }

    // Chamar API do WPPConnect para criar sessão
    const response = await tryConnectWPPConnect(
      `${WPPCONNECT_API_URL}/api/sessions/start`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionName: sessionName,
          headless: true,
          devtools: false,
          useChrome: true,
          autoClose: 300000,
          debug: false,
          logQR: true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erro ao criar sessão: ${error.message}`);
    }

    const data = await response.json();
    console.log(`[WPPConnect API] Sessão criada: ${sessionName}`);

    return {
      qrCode: data.qrCode,
      sessionName: sessionName,
    };
  } catch (error) {
    console.error(`[WPPConnect API] Erro ao inicializar sessão ${sessionName}:`, error);
    
    // Fallback para desenvolvimento: gerar QR Code fake
    if (process.env.NODE_ENV === "development") {
      console.warn(`[WPPConnect API] Usando QR Code de desenvolvimento para ${sessionName}`);
      return {
        qrCode: generateMockQRCode(),
        sessionName: sessionName,
      };
    }
    
    throw error;
  }
}

/**
 * Obter status da sessão
 */
export async function getSessionInfo(
  sessionName: string
): Promise<WPPConnectSession | null> {
  try {
    if (USE_MOCK) {
      return {
        sessionName,
        status: "connected",
        isActive: true,
      };
    }

    const response = await tryConnectWPPConnect(
      `${WPPCONNECT_API_URL}/api/sessions/${sessionName}`,
      { method: "GET" }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      sessionName,
      phoneNumber: data.phoneNumber,
      status: data.status,
      isActive: data.isActive,
    };
  } catch (error) {
    console.error(`[WPPConnect API] Erro ao obter info da sessão ${sessionName}:`, error);
    return null;
  }
}

/**
 * Desconectar sessão
 */
export async function disconnectSession(sessionName: string): Promise<void> {
  try {
    if (USE_MOCK) {
      console.log(`[WPPConnect API] Sessão desconectada (MOCK): ${sessionName}`);
      return;
    }

    const response = await tryConnectWPPConnect(
      `${WPPCONNECT_API_URL}/api/sessions/${sessionName}/close`,
      { method: "POST" }
    );

    if (!response.ok) {
      throw new Error("Erro ao desconectar sessão");
    }

    console.log(`[WPPConnect API] Sessão desconectada: ${sessionName}`);
  } catch (error) {
    console.error(`[WPPConnect API] Erro ao desconectar sessão ${sessionName}:`, error);
    throw error;
  }
}

/**
 * Enviar mensagem de texto
 */
export async function sendMessage(
  sessionName: string,
  phoneNumber: string,
  message: string
): Promise<boolean> {
  try {
    if (USE_MOCK) {
      console.log(`[WPPConnect API] Mensagem enviada (MOCK) para ${phoneNumber}: ${message}`);
      return true;
    }

    const formattedNumber = phoneNumber.replace(/\D/g, "");
    const chatId = `${formattedNumber}@c.us`;

    const response = await tryConnectWPPConnect(
      `${WPPCONNECT_API_URL}/api/sessions/${sessionName}/send-message`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: chatId,
          body: message,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Erro ao enviar mensagem");
    }

    return true;
  } catch (error) {
    console.error(
      `[WPPConnect API] Erro ao enviar mensagem via sessão ${sessionName}:`,
      error
    );
    throw error;
  }
}

/**
 * Enviar mensagem com mídia
 */
export async function sendMediaMessage(
  sessionName: string,
  phoneNumber: string,
  mediaUrl: string,
  caption?: string
): Promise<boolean> {
  try {
    if (USE_MOCK) {
      console.log(`[WPPConnect API] Mídia enviada (MOCK) para ${phoneNumber}`);
      return true;
    }

    const formattedNumber = phoneNumber.replace(/\D/g, "");
    const chatId = `${formattedNumber}@c.us`;

    const response = await tryConnectWPPConnect(
      `${WPPCONNECT_API_URL}/api/sessions/${sessionName}/send-file`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: chatId,
          url: mediaUrl,
          caption: caption || "",
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Erro ao enviar mídia");
    }

    return true;
  } catch (error) {
    console.error(
      `[WPPConnect API] Erro ao enviar mídia via sessão ${sessionName}:`,
      error
    );
    throw error;
  }
}

/**
 * Listar todas as sessões
 */
export async function getActiveSessions(): Promise<string[]> {
  try {
    if (USE_MOCK) {
      return ["mock-session"];
    }

    const response = await tryConnectWPPConnect(
      `${WPPCONNECT_API_URL}/api/sessions`,
      { method: "GET" }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.sessions || [];
  } catch (error) {
    console.error("[WPPConnect API] Erro ao listar sessões:", error);
    return [];
  }
}

/**
 * Verificar se sessão está conectada
 */
export async function isSessionConnected(sessionName: string): Promise<boolean> {
  try {
    if (USE_MOCK) {
      return true;
    }

    const session = await getSessionInfo(sessionName);
    return session?.status === "connected" && session?.isActive === true;
  } catch (error) {
    console.error(`[WPPConnect API] Erro ao verificar conexão da sessão ${sessionName}:`, error);
    return false;
  }
}

/**
 * Obter QR Code da sessão
 */
export async function getQRCode(sessionName: string): Promise<string | null> {
  try {
    if (USE_MOCK) {
      return generateMockQRCode();
    }

    const response = await tryConnectWPPConnect(
      `${WPPCONNECT_API_URL}/api/sessions/${sessionName}/qr-code`,
      { method: "GET" }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.qrCode || null;
  } catch (error) {
    console.error(`[WPPConnect API] Erro ao obter QR Code da sessão ${sessionName}:`, error);
    return null;
  }
}

/**
 * Verificar saúde da API WPPConnect
 */
export async function checkWPPConnectHealth(): Promise<boolean> {
  try {
    if (USE_MOCK) {
      return true;
    }

    const response = await tryConnectWPPConnect(
      `${WPPCONNECT_API_URL}/api/health`,
      { method: "GET" }
    );
    return response.ok;
  } catch (error) {
    console.error("[WPPConnect API] Erro ao verificar saúde da API:", error);
    return false;
  }
}
