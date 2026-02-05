const config = require('../config');
const { loggers } = require('../utils/logger');

/**
 * Gera prioridades semanais usando IA
 * 
 * TODO: Integrar com OpenAI quando OPENAI_API_KEY estiver configurada
 * Por enquanto, usa gerador determinístico baseado no contexto
 * 
 * @param {{ context?: string, weekStart: string }} input
 * @returns {Promise<Array<{ title: string, category: string, reasoning: string }>>}
 */
const generatePriorities = async ({ context = '', weekStart }) => {
    // Se OpenAI estiver configurada, usar
    if (config.openai?.apiKey) {
        return generateWithOpenAI({ context, weekStart });
    }

    // Fallback: gerador determinístico
    return generateDeterministic({ context });
};

/**
 * Gerador determinístico (stub)
 * Analisa palavras-chave no contexto para criar prioridades relevantes
 */
const generateDeterministic = ({ context }) => {
    const priorities = [];
    const contextLower = (context || '').toLowerCase();

    // Prioridade 1: baseada em palavras-chave
    if (contextLower.includes('reunião') || contextLower.includes('meeting')) {
        priorities.push({
            title: 'Preparar para reuniões da semana',
            category: 'trabalho',
            reasoning: 'Identificado que você tem reuniões. Preparação reduz ansiedade.',
        });
    } else if (contextLower.includes('entrega') || contextLower.includes('prazo') || contextLower.includes('deadline')) {
        priorities.push({
            title: 'Focar na entrega principal',
            category: 'trabalho',
            reasoning: 'Prazo identificado. Concentrar energia no que gera impacto.',
        });
    } else {
        priorities.push({
            title: 'Definir a tarefa mais importante da semana',
            category: 'planejamento',
            reasoning: 'Clareza sobre o que importa reduz ansiedade de domingo.',
        });
    }

    // Prioridade 2: organização
    if (contextLower.includes('caos') || contextLower.includes('bagunça') || contextLower.includes('organizar')) {
        priorities.push({
            title: 'Organizar ambiente de trabalho',
            category: 'organização',
            reasoning: 'Ambiente organizado melhora foco e produtividade.',
        });
    } else {
        priorities.push({
            title: 'Revisar agenda e bloquear tempo para foco',
            category: 'planejamento',
            reasoning: 'Proteger tempo evita ser consumido por urgências alheias.',
        });
    }

    // Prioridade 3: vida pessoal
    if (contextLower.includes('saúde') || contextLower.includes('exercício') || contextLower.includes('academia')) {
        priorities.push({
            title: 'Manter compromisso com saúde física',
            category: 'vida_pessoal',
            reasoning: 'Sua energia física impacta tudo mais. Não negligencie.',
        });
    } else {
        priorities.push({
            title: 'Uma atividade pessoal que recarrega',
            category: 'vida_pessoal',
            reasoning: 'Evitar terminar a semana zerado fora do trabalho.',
        });
    }

    return priorities;
};

/**
 * Gerador usando OpenAI
 * TODO: Implementar quando configurado
 */
const generateWithOpenAI = async ({ context }) => {
    // TODO: Implementar chamada para OpenAI
    // const { Configuration, OpenAIApi } = require('openai');
    // const configuration = new Configuration({ apiKey: config.openai.apiKey });
    // const openai = new OpenAIApi(configuration);

    // TODO(SEGUNDA-LEVE): Implement OpenAI call when API key is configured
    loggers.ai.info('OpenAI configured but not implemented. Using deterministic fallback.');
    return generateDeterministic({ context });
};

module.exports = {
    generatePriorities,
    generateDeterministic,
    generateWithOpenAI,
};
