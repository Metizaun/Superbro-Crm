import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PenTool, MessageSquare, Mail, Phone, Sparkles } from 'lucide-react';
import { ComposerInterface } from '@/components/ComposerInterface';
import { useComposer } from '@/hooks/useComposer';

export default function Composer() {
  const { loadTemplates, loadSequences } = useComposer();

  useEffect(() => {
    loadTemplates();
    loadSequences();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <PenTool className="h-8 w-8 text-primary" />
          AI Composer
        </h1>
        <p className="text-muted-foreground">
          Create professional content with AI assistance. Generate LinkedIn sequences, emails, text messages, and more.
        </p>
      </div>

      <Tabs defaultValue="linkedin" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="linkedin" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            LinkedIn
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Text Messages
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Custom
          </TabsTrigger>
        </TabsList>

        <TabsContent value="linkedin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                LinkedIn Content Generator
              </CardTitle>
              <CardDescription>
                Create professional LinkedIn messages, connection requests, and sequence campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComposerInterface 
                contentType="linkedin"
                placeholder="Generate a LinkedIn connection request for a potential client in the tech industry..."
                suggestions={[
                  "Write a LinkedIn connection request for a CEO of a tech startup",
                  "Create a follow-up message for someone who viewed my profile",
                  "Generate a sequence for nurturing new connections",
                  "Write a professional thank you message after a meeting"
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Content Generator
              </CardTitle>
              <CardDescription>
                Create compelling email campaigns, follow-ups, and automated sequences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComposerInterface 
                contentType="email"
                placeholder="Generate a follow-up email for a sales prospect who downloaded our whitepaper..."
                suggestions={[
                  "Write a welcome email for new subscribers",
                  "Create a follow-up sequence for trial users",
                  "Generate a re-engagement email for inactive contacts",
                  "Write a product announcement email"
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                SMS Content Generator
              </CardTitle>
              <CardDescription>
                Create concise and effective text message campaigns and follow-ups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComposerInterface 
                contentType="sms"
                placeholder="Create a reminder text for an upcoming appointment..."
                suggestions={[
                  "Write an appointment reminder message",
                  "Create a promotional SMS for a sale",
                  "Generate a follow-up text after a service call",
                  "Write a thank you message for a purchase"
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Custom Content Generator
              </CardTitle>
              <CardDescription>
                Generate any type of content with custom requirements and specifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComposerInterface 
                contentType="custom"
                placeholder="Create content for any specific purpose or platform..."
                suggestions={[
                  "Write a social media post for a product launch",
                  "Create a press release template",
                  "Generate a blog post outline",
                  "Write a case study introduction"
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}