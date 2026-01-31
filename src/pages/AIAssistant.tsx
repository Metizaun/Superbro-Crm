import { AIChat } from '@/components/AIChat';
export default function AIAssistant() {
  return <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground">
          Get intelligent insights about your CRM data, generate content, and streamline your workflow with AI.
        </p>
      </div>

      <AIChat suggestions={["Show me my most promising leads", "Generate a follow-up email template", "Analyze my deal pipeline", "Summarize recent contact interactions", "What should I prioritize today?", "Create a sales report summary"]} />
    </div>;
}