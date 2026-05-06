import { AlertTriangle } from 'lucide-react';
import './MedicalDisclaimer.css';

export default function MedicalDisclaimer() {
  return (
    <div className="disclaimer">
      <AlertTriangle size={14} className="disclaimer__icon" />
      <p className="disclaimer__text">
        This tool provides health information only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your healthcare provider.
      </p>
    </div>
  );
}
