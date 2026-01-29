// Tipo de mensaje de log
export interface LogMessage {
    id: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'success';
    message: string;
}

type LogListener = (log: LogMessage) => void;

class LoggerService {
    private logs: LogMessage[] = [];
    private listeners: LogListener[] = [];
    private maxLogs: number = 100;

    constructor() {
        // Mensaje inicial
        this.addLog('info', 'Sistema de logs inicializado. Listo para monitorizar.');
    }

    private addLog(level: LogMessage['level'], message: string) {
        const newLog: LogMessage = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            level,
            message
        };

        this.logs = [newLog, ...this.logs].slice(0, this.maxLogs); // Mantener solo los últimos X logs
        this.notify(newLog);
    }

    // Métodos públicos para registrar eventos
    info(msg: string) { this.addLog('info', msg); }
    warn(msg: string) { this.addLog('warn', msg); }
    error(msg: string) { this.addLog('error', msg); }
    success(msg: string) { this.addLog('success', msg); }

    // Obtener historial completo
    getHistory() { return this.logs; }

    // Sistema de suscripción para componentes React
    subscribe(listener: LogListener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify(log: LogMessage) {
        this.listeners.forEach(l => l(log));
    }
    
    clear() {
        this.logs = [];
        this.addLog('info', 'Historial de consola limpiado.');
    }
}

export const logger = new LoggerService();