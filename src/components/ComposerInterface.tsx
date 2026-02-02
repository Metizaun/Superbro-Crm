import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  Copy, 
  Save, 
  Loader2, 
  Plus,
  Trash2,
  Download
} from 'lucide-react';
import { useComposer, ComposerTemplate, ComposerSequence } from '@/hooks/useComposer';
import { toast } from 'sonner';

interface ComposerInterfaceProps {
  contentType: 'linkedin' | 'email' | 'sms' | 'custom';
  placeholder: string;
  suggestions: string[];
}

export const ComposerInterface = ({ contentType, placeholder, suggestions }: ComposerInterfaceProps) => {
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [sequenceName, setSequenceName] = useState('');
  const [sequenceSteps, setSequenceSteps] = useState<Array<{ title: string; content: string; delay?: number }>>([]);
  
  const {
    isGenerating,
    generatedContent,
    setGeneratedContent,
    templates,
    sequences,
    isLoading,
    generateContent,
    saveTemplate,
    loadTemplates,
    saveSequence,
    loadSequences,
    deleteTemplate,
    deleteSequence
  } = useComposer();

  // Load templates and sequences when component mounts
  useEffect(() => {
    loadTemplates();
    loadSequences();
  }, []); // Empty dependency array since loadTemplates and loadSequences are stable

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    try {
      await generateContent(prompt, contentType, context);
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const handleCopyContent = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      toast.success('Content copied to clipboard');
    }
  };

  const handleSaveTemplate = async () => {
    if (!generatedContent || !templateName.trim()) {
      toast.error('Please provide a template name and generate content first');
      return;
    }

    try {
      await saveTemplate({
        name: templateName,
        content_type: contentType,
        title: prompt,
        content: generatedContent
      });
      setTemplateName('');
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleSaveSequence = async () => {
    if (sequenceSteps.length === 0 || !sequenceName.trim()) {
      toast.error('Please provide a sequence name and add at least one step');
      return;
    }

    try {
      await saveSequence({
        name: sequenceName,
        content_type: contentType,
        description: `${sequenceSteps.length}-step ${contentType} sequence`,
        steps: sequenceSteps
      });
      setSequenceName('');
      setSequenceSteps([]);
    } catch (error) {
      // Error already handled in hook
    }
  };

  const addSequenceStep = () => {
    if (!generatedContent) {
      toast.error('Please generate content first');
      return;
    }

    setSequenceSteps(prev => [...prev, {
      title: `Step ${prev.length + 1}`,
      content: generatedContent,
      delay: prev.length === 0 ? 0 : 24 // 24 hours delay for subsequent steps
    }]);
    setGeneratedContent('');
    setPrompt('');
    toast.success('Step added to sequence');
  };

  const removeSequenceStep = (index: number) => {
    setSequenceSteps(prev => prev.filter((_, i) => i !== index));
  };

  const filteredTemplates = templates.filter(t => t.content_type === contentType);
  const filteredSequences = sequences.filter(s => s.content_type === contentType);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="templates">Templates ({filteredTemplates.length})</TabsTrigger>
          <TabsTrigger value="sequences">Sequences ({filteredSequences.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          {/* Suggestions */}
          <div>
            <Label className="text-sm font-medium">Quick Suggestions</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {suggestions.map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Content Prompt</Label>
            <Textarea
              id="prompt"
              placeholder={placeholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Context Input */}
          <div className="space-y-2">
            <Label htmlFor="context">Additional Context (Optional)</Label>
            <Textarea
              id="context"
              placeholder="Provide additional context, target audience details, or specific requirements..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Content
              </>
            )}
          </Button>

          {/* Generated Content */}
          {generatedContent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generated Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className="p-4 bg-muted rounded-lg prose prose-sm max-w-none leading-relaxed [&>p]:mb-3 [&>ul]:mb-3 [&>li]:mb-1 [&>h3]:mb-2 [&>h4]:mb-2"
                  dangerouslySetInnerHTML={{ __html: generatedContent }}
                />
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleCopyContent}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  
                  <Button
                    onClick={addSequenceStep}
                    variant="outline"
                    size="sm"
                    className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Sequence
                  </Button>
                </div>

                <Separator />

                {/* Save as Template */}
                <div className="space-y-2">
                  <Label htmlFor="template-name">Save as Template</Label>
                  <div className="flex gap-2">
                    <Input
                      id="template-name"
                      placeholder="Template name..."
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                    <Button onClick={handleSaveTemplate} variant="outline">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sequence Builder - Always show if steps exist or can be created */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                Sequence Builder
                {sequenceSteps.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {sequenceSteps.length} step{sequenceSteps.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Build multi-step content sequences. Generate content and click "Add to Sequence" to build your sequence.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {sequenceSteps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Plus className="h-8 w-8 text-muted-foreground/50" />
                    <p>No steps in sequence yet</p>
                    <p className="text-sm">Generate content above and click "Add to Sequence" to start building</p>
                  </div>
                </div>
              ) : (
                <>
                  {sequenceSteps.map((step, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Step {index + 1}</Badge>
                          <h4 className="font-medium">{step.title}</h4>
                        </div>
                        <Button
                          onClick={() => removeSequenceStep(index)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Delay: {step.delay === 0 ? 'Immediate' : `${step.delay} hours`}
                      </p>
                      <div 
                        className="p-3 bg-muted rounded text-sm prose prose-sm max-w-none leading-relaxed [&>p]:mb-2 [&>ul]:mb-2 [&>li]:mb-1"
                        dangerouslySetInnerHTML={{ __html: step.content }}
                      />
                    </div>
                  ))}

                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="sequence-name">Save Sequence</Label>
                    <div className="flex gap-2">
                      <Input
                        id="sequence-name"
                        placeholder="Sequence name..."
                        value={sequenceName}
                        onChange={(e) => setSequenceName(e.target.value)}
                      />
                      <Button onClick={handleSaveSequence} variant="outline">
                        <Save className="w-4 h-4 mr-2" />
                        Save Sequence
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No templates saved yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{template.title}</p>
                      </div>
                      <Button
                        onClick={() => deleteTemplate(template.id!)}
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="p-3 bg-muted rounded text-sm mb-3 prose prose-sm max-w-none leading-relaxed [&>p]:mb-2 [&>ul]:mb-2 [&>li]:mb-1"
                      dangerouslySetInnerHTML={{ __html: template.content }}
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(template.content);
                        toast.success('Template copied to clipboard');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sequences" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Your Sequences</h3>
              <p className="text-sm text-muted-foreground">
                Multi-step content sequences for {contentType} campaigns
              </p>
            </div>
          </div>
          
          {filteredSequences.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <Plus className="h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground font-medium">No sequences created yet</p>
                  <p className="text-sm text-muted-foreground">
                    Build sequences by generating content and adding steps in the Generate tab
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredSequences.map((sequence) => (
                <Card key={sequence.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{sequence.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {sequence.steps.length} steps • {sequence.description}
                        </p>
                      </div>
                      <Button
                        onClick={() => deleteSequence(sequence.id!)}
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                   <CardContent>
                    <div className="space-y-4">
                      {sequence.steps.map((step, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-background">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Step {index + 1}</Badge>
                              <h5 className="font-medium">{step.title}</h5>
                            </div>
                            <Button
                              onClick={() => {
                                navigator.clipboard.writeText(step.content);
                                toast.success('Step content copied to clipboard');
                              }}
                              variant="ghost"
                              size="sm"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Delay: {step.delay === 0 ? 'Immediate' : `${step.delay} hours`}
                          </p>
                          <div 
                            className="p-3 bg-muted rounded text-sm prose prose-sm max-w-none leading-relaxed [&>p]:mb-3 [&>ul]:mb-3 [&>li]:mb-1 [&>h3]:mb-2 [&>h4]:mb-2"
                            dangerouslySetInnerHTML={{ __html: step.content }}
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={() => {
                        const sequenceText = sequence.steps
                          .map((step, i) => `Step ${i + 1}: ${step.title}\nDelay: ${step.delay === 0 ? 'Immediate' : `${step.delay} hours`}\n\n${step.content}`)
                          .join('\n\n---\n\n');
                        navigator.clipboard.writeText(sequenceText);
                        toast.success('Sequence copied to clipboard');
                      }}
                      variant="outline"
                      size="sm"
                      className="mt-3"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Sequence
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};