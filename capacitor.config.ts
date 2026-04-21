import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.mpdevtech.agendai',
    appName: 'Painel Agendaí',
    webDir: 'dist/public',
    server: {
        // URL do servidor de produção — descomente e configure quando o app estiver hospedado
        // url: 'https://seu-dominio.com',
        // cleartext: true, // Permitir HTTP (somente para dev)
        androidScheme: 'https',
    },
    android: {
        buildOptions: {
            keystorePath: undefined,
            keystoreAlias: undefined,
        },
    },
};

export default config;
