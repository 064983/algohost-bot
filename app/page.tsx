import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Camera, Heart } from "lucide-react";
import { WhatsAppLink } from "@/components/whatsapp-link";

const photographs = [
  {
    title: "Style with a story",
    category: "Fashion",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1400&q=85",
    className: "work-card work-card-large",
  },
  {
    title: "A little closer to nature",
    category: "Nature",
    image:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=85",
    className: "work-card work-card-tall",
  },
  {
    title: "Together in faith",
    category: "Church",
    image:
      "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1200&q=85",
    className: "work-card",
  },
  {
    title: "The joy of the game",
    category: "Sports",
    image:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=85",
    className: "work-card",
  },
];

function Photo({ image, title }: { image: string; title: string }) {
  return (
    <div
      className="photo-image"
      role="img"
      aria-label={title}
      style={{ backgroundImage: `url("${image}")` }}
    />
  );
}

export default function Home() {
  return (
    <>
      <section className="hero" id="home">
        <div className="hero-copy-wrap">
          <p className="eyebrow"><span /> Photography for the beautifully ordinary</p>
          <h1>
            The moments
            <br />
            that <em>feel like you.</em>
          </h1>
          <p className="hero-copy">
            From fashion and sport to church, nature, and life’s milestones:
            thoughtful photographs that tell your story.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="#work">
              Explore the work <ArrowRight size={17} />
            </Link>
            <WhatsAppLink className="button button-quiet">Let’s plan your shoot</WhatsAppLink>
          </div>
          <a className="scroll-note" href="#work">
            <ArrowDown size={15} /> A little further down
          </a>
        </div>
        <div className="hero-photo">
          <Photo
            image="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1500&q=90"
            title="A couple sharing a quiet moment on their wedding day"
          />
          <div className="photo-caption">
            <span>YOUR STORY, BEAUTIFULLY SEEN</span>
            <span>01 — 04</span>
          </div>
          <div className="hero-stamp"><Camera size={17} /><span>Made with<br />feeling</span></div>
        </div>
      </section>

      <section className="work-section section" id="work">
        <div className="section-heading">
          <div>
            <p className="section-kicker">A little of everything I love to shoot</p>
            <h2>Stories in every frame.</h2>
          </div>
          <p className="section-intro">
            Fashion, the outdoors, faith, and the thrill of the game.
          </p>
        </div>
        <div className="work-grid">
          {photographs.map((photo, index) => (
            <article className={photo.className} key={photo.title}>
              <Photo image={photo.image} title={`${photo.category}: ${photo.title}`} />
              <div className="work-card-caption">
                <div>
                  <span>{photo.category}</span>
                  <h3>{photo.title}</h3>
                </div>
                <span className="work-number">0{index + 1}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="services-section" id="services">
        <div className="section services-inner">
          <div className="section-heading">
            <div>
              <p className="section-kicker">What I photograph</p>
              <h2>Different stories, one camera.</h2>
            </div>
            <p className="section-intro">
              From a fashion shoot to a match-day moment, I’ll help tell your
              story in photographs.
            </p>
          </div>
          <div className="services-grid">
            <article className="service-card">
              <span className="service-index">01</span>
              <h3>Weddings</h3>
              <p>The happy tears, the dance-floor chaos, and all the lovely things between.</p>
              <Heart size={18} aria-hidden="true" />
            </article>
            <article className="service-card">
              <span className="service-index">02</span>
              <h3>Couples</h3>
              <p>A slow afternoon together, without needing to know what to do with your hands.</p>
              <Heart size={18} aria-hidden="true" />
            </article>
            <article className="service-card">
              <span className="service-index">03</span>
              <h3>Portraits</h3>
              <p>Photographs that let you see yourself the way your favourite people do.</p>
              <Heart size={18} aria-hidden="true" />
            </article>
            <article className="service-card">
              <span className="service-index">04</span>
              <h3>Family & life</h3>
              <p>For the seasons that pass too quickly and the people who make them yours.</p>
              <Heart size={18} aria-hidden="true" />
            </article>
            <article className="service-card">
              <span className="service-index">05</span>
              <h3>Fashion</h3>
              <p>Creative portraits, looks, and campaigns that bring your style to life.</p>
              <Heart size={18} aria-hidden="true" />
            </article>
            <article className="service-card">
              <span className="service-index">06</span>
              <h3>Nature</h3>
              <p>Landscapes, wildlife, and the small details that make the outdoors special.</p>
              <Heart size={18} aria-hidden="true" />
            </article>
            <article className="service-card">
              <span className="service-index">07</span>
              <h3>Church</h3>
              <p>Meaningful moments from worship, ceremonies, and church community events.</p>
              <Heart size={18} aria-hidden="true" />
            </article>
            <article className="service-card">
              <span className="service-index">08</span>
              <h3>Sports</h3>
              <p>On-the-action coverage of the effort, energy, and emotion of the game.</p>
              <Heart size={18} aria-hidden="true" />
            </article>
          </div>
        </div>
      </section>

      <section className="about-section section" id="about">
        <div className="about-photo">
          <Photo
            image="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1100&q=85"
            title="A camera ready to capture a story"
          />
          <span className="about-photo-note">A GOOD DAY, WELL REMEMBERED.</span>
        </div>
        <div className="about-copy">
          <p className="section-kicker">A little about the approach</p>
          <h2>Nothing to perform. Just be here.</h2>
          <p>
            The best photographs rarely happen when everything is perfectly
            posed. I’ll give you a little direction, help you feel at ease, and
            leave space for the real stuff to unfold.
          </p>
          <p>
            The wind-tangled hair. The belly laugh. The look you didn’t know
            anyone caught. Those are the photographs you’ll come back to.
          </p>
          <WhatsAppLink className="text-cta">
            Tell me what you have in mind <ArrowUpRight size={17} />
          </WhatsAppLink>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-inner">
          <p className="section-kicker">Your story, whenever you’re ready</p>
          <h2>Let’s make something<br /><em>you’ll keep forever.</em></h2>
          <p>Planning a fashion shoot, nature session, church event, or sports match? Let’s talk.</p>
          <WhatsAppLink className="button button-light">
            Say hello on WhatsApp <ArrowUpRight size={17} />
          </WhatsAppLink>
          <span className="contact-doodle" aria-hidden="true">✳</span>
        </div>
      </section>
    </>
  );
}
