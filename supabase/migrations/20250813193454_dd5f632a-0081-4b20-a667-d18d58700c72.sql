-- Create reviews table to store Google Business reviews
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL,
  google_review_id TEXT NOT NULL UNIQUE,
  author_name TEXT NOT NULL,
  author_photo_url TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create replies table to store AI-generated replies
CREATE TABLE public.review_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL,
  generated_reply TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'sent')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Users can view reviews of their locations" 
ON public.reviews 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM locations 
  WHERE locations.id = reviews.location_id 
  AND locations.user_id = auth.uid()
));

CREATE POLICY "Users can manage reviews of their locations" 
ON public.reviews 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM locations 
  WHERE locations.id = reviews.location_id 
  AND locations.user_id = auth.uid()
));

-- Create policies for review_replies
CREATE POLICY "Users can view replies of their reviews" 
ON public.review_replies 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM reviews 
  JOIN locations ON locations.id = reviews.location_id
  WHERE reviews.id = review_replies.review_id 
  AND locations.user_id = auth.uid()
));

CREATE POLICY "Users can manage replies of their reviews" 
ON public.review_replies 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM reviews 
  JOIN locations ON locations.id = reviews.location_id
  WHERE reviews.id = review_replies.review_id 
  AND locations.user_id = auth.uid()
));

-- Add foreign key constraints
ALTER TABLE public.reviews 
ADD CONSTRAINT fk_reviews_location 
FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;

ALTER TABLE public.review_replies 
ADD CONSTRAINT fk_replies_review 
FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_review_replies_updated_at
  BEFORE UPDATE ON public.review_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();