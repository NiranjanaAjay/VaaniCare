import {
  Heart,
  AlertTriangle,
  Scale,
  Building2,
  Briefcase,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceId } from "@/lib/voiceNavigation";

interface ServiceCardProps {
  id: ServiceId;
  name: string;
  description: string;
  onClick: (id: ServiceId) => void;
  isSelected?: boolean;
}

const serviceIcons: Record<ServiceId, LucideIcon> = {
  healthcare: Heart,
  emergency: AlertTriangle,
  legal: Scale,
  government: Building2,
  employment: Briefcase,
};

const serviceStyles: Record<ServiceId, string> = {
  healthcare: "service-card-healthcare",
  emergency: "service-card-emergency",
  legal: "service-card-legal",
  government: "service-card-government",
  employment: "service-card-employment",
};

export function ServiceCard({
  id,
  name,
  description,
  onClick,
  isSelected,
}: ServiceCardProps) {
  const Icon = serviceIcons[id];
  const styleClass = serviceStyles[id];

  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        "service-card w-full text-left",
        styleClass,
        isSelected &&
          "ring-4 ring-white ring-offset-4 ring-offset-background scale-[1.02]",
      )}
      aria-label={`${name}: ${description}`}
      role="button"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-3 bg-white/20 rounded-xl">
          <Icon className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl sm:text-2xl font-bold mb-1 truncate">
            {name}
          </h3>
          <p className="text-sm sm:text-base opacity-90 line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

// Grid of all services
interface ServiceGridProps {
  onServiceSelect: (id: ServiceId) => void;
  selectedService?: ServiceId | null;
  translations: {
    getName: (id: ServiceId) => string;
    getDescription: (id: ServiceId) => string;
  };
}

export function ServiceGrid({
  onServiceSelect,
  selectedService,
  translations,
}: ServiceGridProps) {
  const services: ServiceId[] = [
    "healthcare",
    "emergency",
    "legal",
    "government",
    "employment",
  ];

  return (
    <div className="grid grid-cols-1 gap-4 w-full max-w-lg mx-auto">
      {services.map((id) => (
        <ServiceCard
          key={id}
          id={id}
          name={translations.getName(id)}
          description={translations.getDescription(id)}
          onClick={onServiceSelect}
          isSelected={selectedService === id}
        />
      ))}
    </div>
  );
}
