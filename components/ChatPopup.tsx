import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, AiCalcItem, AiBudgetItem, AiParsedResponse, CalculationGroup, BudgetItem } from '../types';
import { blobToBase64 } from '../utils';
import { useLocalization } from '../LanguageContext';

interface ChatPopupProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onAiResponse: (response: AiParsedResponse) => string;
  calculationGroups: CalculationGroup[];
  budgetItems: BudgetItem[];
  showToast: (message: string, type?: 'success' | 'error') => void;
  apiKey: string;
}

const ChatPopup: React.FC<ChatPopupProps> = ({ 
  isOpen, onToggle, messages, setMessages, onAiResponse, calculationGroups, budgetItems, showToast, apiKey
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLocalization();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  const systemInstruction = useMemo(() => {
    const calcContext = calculationGroups.map(g => ({
        name: g.name,
        variables: g.variables.filter(v => !v.isFormulaResult).map(v => ({
            code: v.code,
            description: v.description
        }))
    }));
    
    const budgetContext = budgetItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalCost: item.quantity * item.unitPrice,
      sector: item.sector
    }));

    return `Você é um assistente especialista para o aplicativo 'Gerador de Orçamentos'. Sua função é ajudar os usuários a gerenciar seus orçamentos, executando três ações principais:
1.  **Calcular Itens Complexos**: Analisar a entrada do usuário (texto ou imagem) e extrair itens que correspondem a uma das calculadoras. A aplicação irá calcular e adicionar os resultados ao orçamento automaticamente.
2.  **Adicionar Itens Simples**: Analisar a entrada e extrair itens que NÃO precisam de cálculo para serem adicionados diretamente ao orçamento.
3.  **Responder a Perguntas**: Fornecer informações consultando o orçamento atual.

**AÇÕES E REGRAS:**
- **Entrada com Imagem (Planta Baixa):** Sua tarefa é realizar uma análise visual detalhada. Procure por **símbolos padrão de arquitetura e elétrica**. Identifique:
    -   **Luminárias:** Círculos, quadrados ou ícones específicos.
    -   **Tomadas:** Triângulos (simples, duplas), círculos com traços.
    -   **Interruptores:** Símbolos 'S' (simples, paralelo).
    -   **Infraestrutura:** Linhas contínuas ou tracejadas para **eletrodutos**, retângulos longos para **perfilados/eletrocalhas**.
    -   **Quadros:** Retângulos maiores com legendas como 'QDL', 'QDF'.
    -   **Texto na imagem:** Leia legendas, tabelas de materiais ou notas para obter descrições e quantidades precisas. Use a contagem de símbolos para estimar as quantidades de cada item. Tente categorizar CADA item identificado para 'calculate' ou 'budget'.

- **Entrada com Texto (Lista de Itens):** Sua tarefa é processar **TODOS** os itens da lista do usuário, mesmo que o nome não seja exato. Seja flexível com sinônimos e descrições parciais.
    -   'Spot', 'lâmpada de teto' -> Mapeie para a calculadora 'Iluminação'.
    -   'Cabo de rede', 'cabo UTP' -> Mapeie para a calculadora 'Rede Estruturada' ou 'CFTV'.
    -   'Caixa de passagem 4x2' -> Mapeie para 'Elétrica Acabamento' se existir, ou adicione ao 'budget'.
    -   Se um item parecer complexo mas não houver uma calculadora correspondente, adicione-o diretamente ao 'budget' no setor 'Diversos'. **É crucial que nenhum item da lista do usuário seja ignorado.**

- **Consultas:** Se o usuário fizer uma pergunta sobre o orçamento, use o 'CONTEXTO DO ORÇAMENTO ATUAL' para formular uma resposta na chave 'answer'.

**CALCULADORAS DISPONÍVEIS (para ação 'calculate'):**
${JSON.stringify(calcContext, null, 2)}

**CONTEXTO DO ORÇAMENTO ATUAL (para ação 'answer'):**
${JSON.stringify(budgetContext, null, 2)}

**FORMATO DA RESPOSTA OBRIGATÓRIO:**
Você DEVE responder APENAS com um único objeto JSON que corresponda ao esquema. O objeto pode conter uma ou mais das seguintes chaves: 'calculate', 'budget', 'answer'.

-   \`calculate\`: Array de objetos, cada um com 'groupName' e um array 'variables' ('code', 'value').
-   \`budget\`: Array de objetos, cada um com 'description', 'quantity' e 'sector'.
-   \`answer\`: String contendo a resposta a uma pergunta.

**EXEMPLOS:**
-   **Usuário envia texto:** "preciso de 12 spots de led (pequenos), 4 luminárias de embutir (grandes), 100m de cabo de rede cat 6 e um alicate."
    **Sua Saída JSON:**
    { "calculate": [{ "groupName": "Iluminação", "variables": [{ "code": "LP", "value": 12 }, { "code": "LG", "value": 4 }] }, { "groupName": "Rede Estruturada", "variables": [{ "code": "CABO_UTP", "value": 100 }] } ], "budget": [{ "description": "Alicate", "quantity": 1, "sector": "Ferramentas" }] }

-   **Usuário envia imagem de planta e texto:** "orçar esta planta"
    **Sua Saída JSON (exemplo):**
    { "calculate": [{ "groupName": "Iluminação", "variables": [{ "code": "LG", "value": 8 }] }], "budget": [{ "description": "Tomada simples", "quantity": 12, "sector": "Elétrica Acabamento" }] }

-   **Usuário envia texto:** "quanto já gastamos com Alvenaria?"
    **Sua Saída JSON:** 
    { "answer": "Até agora, o custo total para o setor de Alvenaria é de R$ 1.780,00." }`;
  }, [calculationGroups, budgetItems]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAttachedFile(event.target.files[0]);
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedInput = inputText.trim();
    if (!trimmedInput && !attachedFile) return;

    setIsLoading(true);
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmedInput,
    };
    if (attachedFile) {
      userMessage.file = { name: attachedFile.name, type: attachedFile.type };
    }
    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    if (!apiKey) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + 'e',
        sender: 'assistant',
        text: "Por favor, configure sua Chave de API na aba 'Configurações' para usar o assistente.",
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      return;
    }
    
    try {
      const ai = new GoogleGenAI({apiKey: apiKey});
      const contents: { parts: any[] } = { parts: [] };
      let prompt = trimmedInput;

      if (attachedFile) {
        if (!attachedFile.type.startsWith('image/')) {
            throw new Error("Formato de arquivo não suportado. Por favor, envie uma imagem (PNG, JPG, etc.).");
        }
        const base64Data = await blobToBase64(attachedFile);
        contents.parts.push({
          inlineData: {
            mimeType: attachedFile.type,
            data: base64Data,
          },
        });
        prompt = `Analise esta planta baixa ou imagem. Identifique todos os componentes elétricos e de infraestrutura visíveis (como luminárias, tomadas, interruptores, perfilados, etc.). Use o seu conhecimento para estimar quantidades se necessário. Responda usando o formato JSON padrão. ${trimmedInput}`;
      }
      setAttachedFile(null); // Clear file after processing it
      
      contents.parts.push({ text: prompt });

      const responseSchema = {
          type: Type.OBJECT,
          properties: {
            calculate: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { groupName: { type: Type.STRING }, variables: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { code: { type: Type.STRING }, value: { type: Type.NUMBER }, }, required: ['code', 'value'], } } }, required: ['groupName', 'variables'] } },
            budget: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, quantity: { type: Type.NUMBER }, sector: { type: Type.STRING }, }, required: ['description', 'quantity', 'sector'] } },
            answer: { type: Type.STRING }
          }
        };

      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contents,
          config: {
              systemInstruction: systemInstruction,
              responseMimeType: "application/json",
              responseSchema: responseSchema,
          },
      });
      
      let assistantText = '';

      try {
          const jsonStr = response.text.trim();
          const parsedResponse: AiParsedResponse = JSON.parse(jsonStr);
          assistantText = onAiResponse(parsedResponse);
      } catch(e) {
          console.error("Error parsing AI JSON response:", e);
          assistantText = response.text || "Desculpe, não consegui processar sua solicitação. A resposta não estava no formato esperado.";
      }
      
      const assistantMessage: ChatMessage = {
          id: Date.now().toString() + 'r',
          sender: 'assistant',
          text: assistantText,
      };
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error: any) {
      console.error("Gemini API error or file error:", error);
      const errorMessageText = error.message || 'Ocorreu um erro ao comunicar com o assistente. Por favor, tente novamente.';
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + 'e',
        sender: 'assistant',
        text: errorMessageText,
      };
      setMessages(prev => [...prev, errorMessage]);
      showToast(errorMessageText, 'error');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <div className={`fixed bottom-8 right-8 z-50 transition-transform duration-300 ${isOpen ? 'scale-0' : 'scale-100'}`}>
        <button
          onClick={onToggle}
          className="bg-primary hover:bg-primary-light text-white rounded-full p-4 shadow-lg flex items-center justify-center"
          aria-label="Abrir chat do assistente"
          title={t('chat.open')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
            <path d="M2 11.5A1.5 1.5 0 013.5 10h1.414a2 2 0 001.414-.586l.293-.293a1 1 0 011.414 0l.293.293a2 2 0 001.414.586H16.5a1.5 1.5 0 011.5 1.5v.654L15.414 15H4.586L2 12.154V11.5z" />
          </svg>
        </button>
      </div>
      <div className={`fixed bottom-8 right-8 z-50 w-[90vw] max-w-md h-[70vh] max-h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-lg font-bold text-text dark:text-gray-100">{t('chat.title')}</h3>
          <button onClick={onToggle} className="text-subtle dark:text-gray-400 hover:text-gray-800 dark:hover:text-white" aria-label="Fechar chat">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-grow p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg px-3 py-2 max-w-xs md:max-w-sm break-words ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-text dark:text-gray-100'}`}>
                  {msg.file && (
                    <div className="mb-2 p-2 bg-black/10 rounded-md text-xs flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                       <span className="truncate">{msg.file.name}</span>
                    </div>
                  )}
                  {msg.text && <p className="text-sm">{msg.text}</p>}
                </div>
              </div>
            ))}
            {isLoading && (
                 <div className="flex items-end gap-2 justify-start">
                    <div className="rounded-lg px-3 py-2 bg-gray-200 dark:bg-gray-700 text-text dark:text-gray-100">
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          {!apiKey && (
              <div className="text-center text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-md mb-2">
                  A chave de API não está configurada. Vá para a aba 'Configurações' para adicioná-la.
              </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
             <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" />
             <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-subtle dark:text-gray-400 hover:text-primary dark:hover:text-primary-light" aria-label="Anexar arquivo">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
             </button>
            <div className="flex-grow relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Envie uma lista ou uma planta..."
                  className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-full shadow-sm focus:ring-primary-light focus:border-primary-light sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  disabled={isLoading}
                />
                 {attachedFile && (
                    <div className="absolute bottom-full left-0 mb-1 w-full text-xs">
                        <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-md flex justify-between items-center">
                            <span className="truncate">Anexado: {attachedFile.name}</span>
                            <button onClick={() => setAttachedFile(null)} type="button" className="ml-2 font-bold">x</button>
                        </div>
                    </div>
                )}
            </div>
            <button type="submit" className="bg-primary text-white rounded-full p-2 hover:bg-primary-light disabled:bg-gray-400" disabled={isLoading || (!inputText && !attachedFile) || !apiKey}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ChatPopup;