
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import ImageUpload from '@/components/forms/ImageUpload';

const channelSchema = z.object({
  name: z.string().min(1, 'Channel name is required'),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  isActive: z.boolean().default(true)
});

type ChannelFormData = z.infer<typeof channelSchema>;

interface ChannelFormProps {
  onSubmit: (data: ChannelFormData) => void;
  initialData?: Partial<ChannelFormData>;
  isLoading?: boolean;
  submitLabel?: string;
}

const ChannelForm: React.FC<ChannelFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  submitLabel = 'Save Channel'
}) => {
  const form = useForm<ChannelFormData>({
    resolver: zodResolver(channelSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      logoUrl: initialData?.logoUrl || '',
      bannerUrl: initialData?.bannerUrl || '',
      isActive: initialData?.isActive ?? true
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Channel Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter channel name"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Enter channel description"
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ImageUpload
                  label="Channel Logo"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bannerUrl"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ImageUpload
                  label="Channel Banner"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-white">Active Channel</FormLabel>
                <div className="text-sm text-gray-400">
                  Enable this channel to make it visible to users
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
      </form>
    </Form>
  );
};

export default ChannelForm;
