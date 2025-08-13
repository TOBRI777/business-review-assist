import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/ui/hero-section";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ReviewCard } from "@/components/dashboard/ReviewCard";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Star,
  Building2,
  Settings,
  Plus
} from "lucide-react";

const Index = () => {
  // Sample data for demonstration
  const stats = [
    {
      title: "Avis en attente",
      value: 12,
      description: "Nécessitent une réponse",
      icon: MessageSquare,
      trend: { value: 8, direction: "up" as const }
    },
    {
      title: "Note moyenne",
      value: "4.6",
      description: "Sur 5 étoiles",
      icon: Star,
      trend: { value: 2, direction: "up" as const }
    },
    {
      title: "Établissements",
      value: 3,
      description: "Connectés à Google",
      icon: Building2
    },
    {
      title: "Réponses automatiques",
      value: "89%",
      description: "Taux d'automatisation",
      icon: TrendingUp,
      trend: { value: 12, direction: "up" as const }
    }
  ];

  const sampleReviews = [
    {
      id: "1",
      author: "Marie Dubois",
      rating: 5,
      text: "Excellent service ! L'équipe était très professionnelle et à l'écoute. Je recommande vivement pour toute prestation de qualité.",
      createdAt: "2024-01-15T10:30:00Z",
      locationName: "Paris Centre",
      hasReply: false,
      replyStatus: "draft" as const
    },
    {
      id: "2", 
      author: "Jean Martin",
      rating: 2,
      text: "Très déçu de ma visite. L'attente était longue et le service client peu aimable. J'espère que vous améliorerez cela.",
      createdAt: "2024-01-14T15:45:00Z",
      locationName: "Lyon Part-Dieu",
      hasReply: false
    },
    {
      id: "3",
      author: "Sophie Laurent",
      rating: 4,
      text: "Globalement satisfaite, bon rapport qualité-prix. Peut-être quelques améliorations possibles sur l'accueil mais rien de grave.",
      createdAt: "2024-01-13T09:15:00Z",
      locationName: "Marseille Vieux-Port",
      hasReply: true
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Dashboard Preview */}
        <section className="py-20 bg-surface-secondary/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-text-primary mb-4">
                Tableau de bord en temps réel
              </h2>
              <p className="text-xl text-text-muted max-w-2xl mx-auto">
                Surveillez vos avis, analysez les tendances et optimisez votre réputation en ligne
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {stats.map((stat, index) => (
                <StatsCard
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  description={stat.description}
                  icon={stat.icon}
                  trend={stat.trend}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` } as any}
                />
              ))}
            </div>

            {/* Reviews Section */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-text-primary mb-2">
                    Avis récents
                  </h3>
                  <p className="text-text-muted">
                    Gérez les avis de tous vos établissements
                  </p>
                </div>
                <Button 
                  variant="glass" 
                  className="flex items-center gap-2"
                  onClick={() => window.location.href = '/auth/google'}
                >
                  <Plus className="w-4 h-4" />
                  Connecter un établissement
                </Button>
              </div>

              <div className="grid gap-6">
                {sampleReviews.map((review, index) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    onGenerateReply={(id) => console.log("Generate reply for:", id)}
                    onApproveReply={(id) => console.log("Approve reply for:", id)}
                  />
                ))}
              </div>

              <div className="text-center">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Voir tous les avis
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
