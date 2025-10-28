/**
 * @file This file contains utility functions for manipulating n8n workflow templates.
 * The primary function `parseAndModifyWorkflow` takes a template and a configuration
 * object to dynamically build a new workflow.
 */

// A basic representation of an n8n node for type safety.
interface N8nNode {
  id: string;
  parameters: any;
  [key: string]: any;
}

// A basic representation of an n8n workflow for type safety.
interface N8nWorkflow {
  nodes: N8nNode[];
  connections: any;
}

/**
 * Defines the configuration options that can be dynamically
 * injected into the n8n workflow template.
 */
export interface WorkflowConfig {
  scheduleHour: number;
  systemPrompt: string; // Este é o contexto JÁ SINTETIZADO pela IA
  instanceApiUrl: string;
  instanceName: string;
  instanceApiKey: string;
  name: string; // NOVO
  timezone: string; // NOVO
  isActive: boolean; // NOVO
}

// Hardcoded IDs for the nodes we need to modify in the template.
// These are specific to the 'workflow-ativo-base.json' template.
const NODE_IDS = {
  SCHEDULE: "879e518c-c149-45bb-a8a5-983b044cd37c",
  AI_AGENT: "fbbbfb14-0e19-4def-b68c-88597b023cf4",
  HTTP_REQUEST: "85b124db-9431-4d70-83e0-c0d347379f81",
};

/**
 * Parses a workflow template string and modifies it with user-provided configurations.
 * This approach is robust and safe, as it manipulates the parsed JSON object directly.
 *
 * @param templateString The raw string content of the workflow.json file.
 * @param config The configuration object with user settings.
 * @returns The modified workflow as a JavaScript object, ready to be sent to the n8n API.
 * @throws {Error} If parsing fails, or if a required node is not found in the template.
 */
export const parseAndModifyWorkflow = (templateString: string, config: WorkflowConfig): object => {
  let parsedTemplate: N8nWorkflow;

  try {
    parsedTemplate = JSON.parse(templateString);
  } catch (error) {
    console.error("Failed to parse workflow template JSON:", error);
    throw new Error("The workflow template is invalid or could not be read.");
  }

  // Create a new, clean workflow object to avoid sending extra metadata
  const cleanWorkflow: Partial<N8nWorkflow> & { name?: string; settings?: object } = {};

  // 1. Copy only the allowed properties from the template
  cleanWorkflow.nodes = parsedTemplate.nodes;
  cleanWorkflow.connections = parsedTemplate.connections;

  // 2. Find and update the Schedule Trigger node
  const scheduleNode = cleanWorkflow.nodes.find(n => n.id === NODE_IDS.SCHEDULE);
  if (scheduleNode) {
    scheduleNode.parameters.rule.interval[0].triggerAtHour = config.scheduleHour;
  } else {
    throw new Error(`Node with ID ${NODE_IDS.SCHEDULE} (Schedule) not found in workflow template.`);
  }

  // 3. Find and update the AI Agent node
  const agentNode = cleanWorkflow.nodes.find(n => n.id === NODE_IDS.AI_AGENT);
  if (agentNode) {
    agentNode.parameters.options.systemMessage = config.systemPrompt;
  } else {
    throw new Error(`Node with ID ${NODE_IDS.AI_AGENT} (AI Agent) not found in workflow template.`);
  }

  // 4. Find and update the HTTP Request node
  const httpNode = cleanWorkflow.nodes.find(n => n.id === NODE_IDS.HTTP_REQUEST);
  if (httpNode) {
    const baseUrl = config.instanceApiUrl.replace(/\/$/, '');
    httpNode.parameters.url = `${baseUrl}/message/sendText/${config.instanceName}`;
    const apiKeyParameter = httpNode.parameters.headerParameters.parameters.find((p: any) => p.name === 'apikey');
    if (apiKeyParameter) {
      apiKeyParameter.value = config.instanceApiKey;
    } else {
      throw new Error(`'apikey' parameter not found in HTTP Request node's headers.`);
    }
  } else {
    throw new Error(`Node with ID ${NODE_IDS.HTTP_REQUEST} (HTTP Request) not found in workflow template.`);
  }

  // 5. Add required top-level properties for the API
  cleanWorkflow.name = config.name;
  cleanWorkflow.settings = {
    executionOrder: "v1",
    timezone: config.timezone,
    saveExecutionProgress: true,
    saveManualExecutions: true,
  };

  return cleanWorkflow;
};
