
-- Check if policies exist and create only the missing ones
DO $$
BEGIN
    -- Create INSERT policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_subscriptions' 
        AND policyname = 'Users can manage their own subscriptions'
    ) THEN
        CREATE POLICY "Users can manage their own subscriptions" ON public.user_subscriptions
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Create DELETE policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_subscriptions' 
        AND policyname = 'Users can delete their own subscriptions'
    ) THEN
        CREATE POLICY "Users can delete their own subscriptions" ON public.user_subscriptions
          FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- Create channels policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'channels' 
        AND policyname = 'Anyone can view active channels'
    ) THEN
        CREATE POLICY "Anyone can view active channels" ON public.channels
          FOR SELECT USING (is_active = true);
    END IF;
END
$$;

-- Enable RLS on user_subscriptions if not already enabled
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on channels if not already enabled  
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
