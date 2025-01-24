import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

class RAGHandler {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.memory = [];
    }

    async selectRelevantSources(query) {
        const sourceDescriptions = {
"xanadu_platform_security.pdf": "Security features, authentication methods, authorization controls, compliance standards, data protection",
                "xanadu_general_release_notes.pdf": "Product updates, new feature releases, improvements, bug fixes, deprecation notices",
                "xanadu_api_references.pdf": "Complete API documentation, endpoint specifications, request/response formats, authentication methods",
                "xanadu_application_development.pdf": "Development guidelines, scripting tutorials, customization options, best practices",
                "xanadu_it_service_management.pdf": "ITSM workflows, incident/problem management, service desk operations, SLA management",
                "xanadu_glossary.pdf": "Comprehensive technical terms, industry definitions, platform-specific concepts",
                "xanadu_customer_service_management.pdf": "Customer service features, case management workflows, SLA tracking, customer engagement tools"
        };

        const response = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: `Analyze the query to determine which documentation sources are most relevant.
            Returns a list of relevant PDF filenames.: ${query}\n${JSON.stringify(sourceDescriptions)}\nReturn only filenames, comma-separated.`
            }],
            temperature: 0
        });

        return response.choices[0].message.content.split(',');
    }

    async getRelevantDocuments(query, sources) {
        const { data, error } = await this.supabase.rpc('match_documents', {
            query_embedding: await this.getEmbedding(query),
            match_count: 4,
            filter: { sources: sources }
        });

        if (error) throw error;
        return data;
    }

    async getEmbedding(text) {
        const response = await this.openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: text
        });
        return response.data[0].embedding;
    }
}

export const ragHandler = new RAGHandler(); 