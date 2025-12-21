/**
 * Ollama Model Configurations
 *
 * Recommended models and their specifications for SafeOS.
 *
 * @module lib/ollama/models
 */

// =============================================================================
// Model Specifications
// =============================================================================

export interface ModelSpec {
  name: string;
  displayName: string;
  purpose: 'triage' | 'analysis' | 'complex';
  ramRequired: string;
  tokensPerSecond: string;
  description: string;
  visionSupport: boolean;
}

export const RECOMMENDED_MODELS: ModelSpec[] = [
  {
    name: 'moondream',
    displayName: 'Moondream 2',
    purpose: 'triage',
    ramRequired: '~830MB',
    tokensPerSecond: '25-40',
    description: 'Fast, lightweight vision model for quick triage analysis',
    visionSupport: true,
  },
  {
    name: 'llava:7b',
    displayName: 'LLaVA 7B',
    purpose: 'analysis',
    ramRequired: '~4.5GB',
    tokensPerSecond: '15-25',
    description: 'Detailed vision analysis with good accuracy',
    visionSupport: true,
  },
  {
    name: 'llama3.2-vision:11b',
    displayName: 'Llama 3.2 Vision 11B',
    purpose: 'complex',
    ramRequired: '~7GB',
    tokensPerSecond: '10-18',
    description: 'Complex scene understanding and nuanced analysis',
    visionSupport: true,
  },
];

// =============================================================================
// Model Helpers
// =============================================================================

export function getModelByPurpose(purpose: 'triage' | 'analysis' | 'complex'): ModelSpec {
  const model = RECOMMENDED_MODELS.find((m) => m.purpose === purpose);
  if (!model) {
    throw new Error(`No model found for purpose: ${purpose}`);
  }
  return model;
}

export function getTriageModel(): ModelSpec {
  return getModelByPurpose('triage');
}

export function getAnalysisModel(): ModelSpec {
  return getModelByPurpose('analysis');
}

export function getComplexModel(): ModelSpec {
  return getModelByPurpose('complex');
}

export function getAllVisionModels(): ModelSpec[] {
  return RECOMMENDED_MODELS.filter((m) => m.visionSupport);
}

// =============================================================================
// Installation Commands
// =============================================================================

export function getInstallCommands(): string[] {
  return [
    '# Install Ollama',
    'curl -fsSL https://ollama.ai/install.sh | sh',
    '',
    '# Pull required models',
    `ollama pull ${getTriageModel().name}`,
    `ollama pull ${getAnalysisModel().name}`,
    '',
    '# Verify installation',
    'ollama list',
    '',
    '# Start Ollama server (if not running)',
    'ollama serve',
  ];
}





