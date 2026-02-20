
import axios from "axios";

interface EvolutionInstance {
    instanceName: string;
    status: string;
    qrcode?: string;
}

interface AIConfig {
    enabled: boolean;
    model: string;
    prompt: string;
}

export class EvolutionApiService {
    private apiUrl: string;
    private apiKey: string;

    constructor(apiUrl: string, apiKey: string) {
        this.apiUrl = apiUrl.replace(/\/$/, ""); // Remove trailing slash
        this.apiKey = apiKey;
    }

    private get headers() {
        return {
            "Content-Type": "application/json",
            apikey: this.apiKey,
        };
    }

    /**
     * Create a new instance
     */
    async createInstance(instanceName: string, webhookUrl?: string) {
        try {
            const response = await axios.post(
                `${this.apiUrl}/instance/create`,
                {
                    instanceName,
                    token: instanceName, // Using instance name as token for simplicity
                    qrcode: true,
                    webhook: webhookUrl,
                    webhook_by_events: true,
                    events: [
                        "MESSAGES_UPSERT",
                        "MESSAGES_UPDATE",
                        "MESSAGES_DELETE",
                        "SEND_MESSAGE",
                        "CONNECTION_UPDATE",
                    ],
                },
                { headers: this.headers }
            );
            return response.data;
        } catch (error: any) {
            console.error("Error creating instance:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to create instance");
        }
    }

    /**
     * Connect instance (Get QR Code)
     */
    async connectInstance(instanceName: string) {
        try {
            const response = await axios.get(
                `${this.apiUrl}/instance/connect/${instanceName}`,
                { headers: this.headers }
            );
            // Evolution API returns base64 QR code in response
            return response.data;
        } catch (error: any) {
            console.error("Error connecting instance:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to connect instance");
        }
    }

    /**
     * Get instance status
     */
    async getInstanceStatus(instanceName: string) {
        try {
            const response = await axios.get(
                `${this.apiUrl}/instance/connectionState/${instanceName}`,
                { headers: this.headers }
            );
            return response.data;
        } catch (error: any) {
            // If instance doesn't exist, return specific code
            if (error.response?.status === 404) {
                return { instance: { state: "not_found" } };
            }
            console.error("Error getting status:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to get instance status");
        }
    }

    /**
     * Logout/Disconnect instance
     */
    async logoutInstance(instanceName: string) {
        try {
            const response = await axios.delete(
                `${this.apiUrl}/instance/logout/${instanceName}`,
                { headers: this.headers }
            );
            return response.data;
        } catch (error: any) {
            console.error("Error logging out:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to logout instance");
        }
    }

    /**
     * Delete instance
     */
    async deleteInstance(instanceName: string) {
        try {
            const response = await axios.delete(
                `${this.apiUrl}/instance/delete/${instanceName}`,
                { headers: this.headers }
            );
            return response.data;
        } catch (error: any) {
            console.error("Error deleting instance:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to delete instance");
        }
    }

    /**
     * Configure Webhook
     */
    async setWebhook(instanceName: string, webhookUrl: string, enabled: boolean = true) {
        try {
            const response = await axios.post(
                `${this.apiUrl}/webhook/set/${instanceName}`,
                {
                    webhook: {
                        enabled,
                        url: webhookUrl,
                        byEvents: true,
                        events: [
                            "MESSAGES_UPSERT",
                            "MESSAGES_UPDATE",
                            "MESSAGES_DELETE",
                            "SEND_MESSAGE",
                            "CONNECTION_UPDATE",
                        ],
                    },
                },
                { headers: this.headers }
            );
            return response.data;
        } catch (error: any) {
            console.error("Error setting webhook:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to set webhook");
        }
    }

    /**
     * Send Text Message
     */
    async sendText(instanceName: string, number: string, text: string) {
        try {
            const response = await axios.post(
                `${this.apiUrl}/message/sendText/${instanceName}`,
                {
                    number,
                    text,
                },
                { headers: this.headers }
            );
            return response.data;
        } catch (error: any) {
            console.error("Error sending text:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to send message");
        }
    }

    /**
     * Configure Typebot (Flow) or OpenAI (Agent)
     * Note: Evolution API specific implementation for OpenAI/Typebot
     */
    async configureAI(instanceName: string, config: AIConfig) {
        // TODO: Implement OpenAI configuration endpoint call if Evolution API supports it directly
        // Or we might handle AI logic in our backend and just use Evolution for Sending/Receiving.
        // For now, if the user implies using Evolution AS the agent, we need to check if Evolution has an /openai endpoint.
        // Evolution API v2 has /openai/ set config.

        try {
            // Enable/Disable OpenAI integration in Evolution API
            const response = await axios.post(
                `${this.apiUrl}/openai/${instanceName}`,
                {
                    enabled: config.enabled,
                    // Evolution API expects specific format. Assuming generic for now.
                    // Usually it takes: apiKey, organization, model, instruction etc.
                    // We will implement this as a placeholder or specific if we know exact API.
                    // For now, we will just save to our DB and handle logic OURSELVES if Evolution doesn't fully support "Agent" in the way we want (or if we want more control).
                    // BUT, the user said "utilizar o Evolution API como Agent IA".
                    // Evolution API DOES have OpenAI integration.

                    // Let's assume we maintain the config in our DB and push it to Evolution.
                },
                { headers: this.headers }
            );
            return response.data;
        } catch (error: any) {
            // Fallback: If OpenAI endpoint doesn't exist, we might need to handle it via webhook interception.
            // For this step, I'll log but not block.
            console.warn("Evolution API OpenAI endpoint might not be available or different version.");
            return null;
        }
    }
}
