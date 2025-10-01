/**
 * PromptManager
 * A utility for managing and rendering LLM prompts
 */

import fs from 'fs/promises';
import path from 'path';

export interface PromptTemplate {
  name: string;
  content: string;
  description?: string;
  lastModified?: Date;
}

export class PromptManager {
  private promptsDir: string;
  private templates: Map<string, PromptTemplate> = new Map();
  private promptsLoaded: boolean = false;

  constructor(promptsDir?: string) {
    // Default to a 'prompts' directory in the same directory as this file
    this.promptsDir = promptsDir || path.join(process.cwd(), 'lib', 'prompts');
  }

  /**
   * Initialize the prompt manager by loading all prompt templates
   */
  async init(): Promise<void> {
    if (this.promptsLoaded) return;
    
    try {
      // Create prompts directory if it doesn't exist
      await fs.mkdir(this.promptsDir, { recursive: true });
      
      // Load all prompt templates
      await this.loadAllPrompts();
      this.promptsLoaded = true;
    } catch (error) {
      console.error('Failed to initialize PromptManager:', error);
      throw error;
    }
  }

  /**
   * Load all prompt templates from the prompts directory
   */
  private async loadAllPrompts(): Promise<void> {
    try {
      // Get all .txt files in the prompts directory
      const files = await fs.readdir(this.promptsDir);
      const promptFiles = files.filter(file => file.endsWith('.txt'));

      // Load each prompt file
      for (const file of promptFiles) {
        const name = path.basename(file, '.txt');
        const filePath = path.join(this.promptsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const stats = await fs.stat(filePath);
        
        this.templates.set(name, {
          name,
          content,
          lastModified: stats.mtime
        });
      }

      console.log(`Loaded ${this.templates.size} prompt templates`);
    } catch (error) {
      console.error('Failed to load prompt templates:', error);
      throw error;
    }
  }

  /**
   * Get a prompt template by name
   * @param name The name of the prompt template
   * @returns The prompt template or undefined if not found
   */
  getTemplate(name: string): PromptTemplate | undefined {
    return this.templates.get(name);
  }

  /**
   * Get all prompt templates
   * @returns Array of all prompt templates
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Create a new prompt template
   * @param name The name of the prompt template
   * @param content The content of the prompt template
   * @param description Optional description of the prompt template
   */
  async createTemplate(name: string, content: string, description?: string): Promise<PromptTemplate> {
    if (this.templates.has(name)) {
      throw new Error(`Prompt template '${name}' already exists`);
    }

    const template: PromptTemplate = {
      name,
      content,
      description,
      lastModified: new Date()
    };

    // Save the template to disk
    await fs.writeFile(
      path.join(this.promptsDir, `${name}.txt`),
      content,
      'utf-8'
    );

    // Add to in-memory cache
    this.templates.set(name, template);

    return template;
  }

  /**
   * Update an existing prompt template
   * @param name The name of the prompt template
   * @param content The new content of the prompt template
   * @param description Optional new description of the prompt template
   */
  async updateTemplate(name: string, content: string, description?: string): Promise<PromptTemplate> {
    if (!this.templates.has(name)) {
      throw new Error(`Prompt template '${name}' does not exist`);
    }

    const template = this.templates.get(name)!;
    template.content = content;
    if (description) template.description = description;
    template.lastModified = new Date();

    // Save the updated template to disk
    await fs.writeFile(
      path.join(this.promptsDir, `${name}.txt`),
      content,
      'utf-8'
    );

    // Update in-memory cache
    this.templates.set(name, template);

    return template;
  }

  /**
   * Delete a prompt template
   * @param name The name of the prompt template
   */
  async deleteTemplate(name: string): Promise<boolean> {
    if (!this.templates.has(name)) {
      return false;
    }

    // Delete the template file
    await fs.unlink(path.join(this.promptsDir, `${name}.txt`));

    // Remove from in-memory cache
    return this.templates.delete(name);
  }

  /**
   * Render a prompt template with variables
   * @param name The name of the prompt template or the template content itself
   * @param variables An object containing variables to replace in the template
   * @returns The rendered prompt
   */
  renderPrompt(nameOrContent: string, variables: Record<string, any> = {}): string {
    // Check if this is a template name or content
    let content = this.templates.has(nameOrContent) 
      ? this.templates.get(nameOrContent)!.content 
      : nameOrContent;
    
    // Replace all variables in the template
    // Format: {{variableName}}
    return content.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const trimmedName = varName.trim();
      
      // Handle conditional sections
      if (trimmedName.startsWith('#')) {
        const conditionName = trimmedName.substring(1);
        return variables[conditionName] ? variables[conditionName].toString() : '';
      }
      
      // Regular variable replacement
      return variables[trimmedName] !== undefined 
        ? variables[trimmedName].toString() 
        : match; // Keep the placeholder if variable not provided
    });
  }

  /**
   * Export all prompt templates to JSON
   * @param filePath Optional file path to save the JSON
   * @returns JSON string of all templates
   */
  async exportTemplates(filePath?: string): Promise<string> {
    const templates = Array.from(this.templates.values());
    const json = JSON.stringify(templates, null, 2);
    
    if (filePath) {
      await fs.writeFile(filePath, json, 'utf-8');
    }
    
    return json;
  }

  /**
   * Import prompt templates from JSON
   * @param json JSON string or object of templates
   * @param overwrite Whether to overwrite existing templates
   */
  async importTemplates(json: string | object, overwrite: boolean = false): Promise<number> {
    const templates = typeof json === 'string' ? JSON.parse(json) : json;
    let imported = 0;
    
    for (const template of templates) {
      if (!template.name || !template.content) continue;
      
      if (!this.templates.has(template.name) || overwrite) {
        await this.createTemplate(
          template.name, 
          template.content, 
          template.description
        );
        imported++;
      }
    }
    
    return imported;
  }
}

// Export a singleton instance
export const promptManager = new PromptManager();

// Helper function to render a prompt with variables
export function renderPrompt(template: string, variables: Record<string, any> = {}): string {
  return promptManager.renderPrompt(template, variables);
}
