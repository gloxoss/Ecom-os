import { Reveal } from "./reveal";
import { ReviewsClient } from "./reviews-client";
import { ReviewsImageFlip } from "./reviews-image-flip";

// Rotations mirror the original's 9 decorative gradient squares.
const SQUARE_ROTATIONS = ["", "", "rotate-90", "-rotate-90", "", "rotate-90", "-rotate-90", "rotate-180", "rotate-180"];

interface ReviewsSectionProps {
  data: {
    label: string;
    image: { src: string; alt: string };
    items: Array<{ quote: string; author: string; rating: number }>;
  };
}

export function ReviewsSection({ data }: ReviewsSectionProps) {
  const { label, image, items } = data;

  return (
    <section className="bg-background py-[120px] lg:py-[150px] xl:py-[250px] overflow-hidden">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="relative w-full max-w-[960px] xl:max-w-[1080px] mx-auto">
          {/* Decorative gradient squares behind the image, like the original */}
          <div aria-hidden data-reveal-fade className="pointer-events-none absolute -top-[325px] -left-[325px] hidden lg:grid grid-cols-3 gap-5">
            {SQUARE_ROTATIONS.map((rotation, i) => (
              <div
                key={i}
                className={`w-[305px] h-[305px] rounded-2xl bg-linear-to-t from-input to-background to-50% ${rotation}`}
              />
            ))}
          </div>

          <div data-reveal className="relative z-[1] flex flex-col md:flex-row items-start gap-5">
            <ReviewsImageFlip image={image} />
            <ReviewsClient label={label} items={items} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
