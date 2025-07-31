import { Modal } from './Modal';
import './AiPromptModal.css';

interface AiPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
}

export const AiPromptModal = ({ isOpen, onClose, prompt }: AiPromptModalProps) => {
  const handleKopieer = () => {
    navigator.clipboard.writeText(prompt);
  };

  const handleOpenChatGPT = () => {
    const chatGptUrl = `https://chat.openai.com/chat?q=${encodeURIComponent(prompt)}`;
    window.open(chatGptUrl, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI-Prompt voor Opdracht-specifieke Criteria">
      <div className="ai-prompt-content">
        <p className="ai-prompt-intro">
          Gebruik de onderstaande prompt in een AI-model (zoals ChatGPT) om specifieke, meetbare criteria te genereren en een (verbeterde) antwoordsleutel te verkrijgen.
        </p>
        <textarea className="ai-prompt-tekst" value={prompt} readOnly />
        <div className="ai-prompt-acties">
          <button onClick={handleKopieer}>Kopieer Prompt</button>
          <button onClick={handleOpenChatGPT}>Open in ChatGPT</button>
        </div>
        <div className="ai-prompt-waarschuwing">
          <p><strong>Let op:</strong> Jij blijft de expert! Gebruik de AI-output als een startpunt, niet als een eindantwoord. Wees kritisch, vergelijk met betrouwbare bronnen en overleg met docenten of medestudenten bij twijfel.</p>
        </div>
      </div>
    </Modal>
  );
}; 