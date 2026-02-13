import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Mail, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';
import academyLogo from '../logo.jpg';
import './WelcomeScreen.css';

const programs = [
  {
    title: 'Yoga and Mind-Body Wellness',
    points: ['Calm breathing and flexibility', 'Daily guided body balance']
  },
  {
    title: 'Hypnosis and Mind Mastery',
    points: ['Stress relief and confidence sessions', 'Focus and motivation practice']
  },
  {
    title: 'Life Skills and Personal Growth',
    points: ['Habit and mindset coaching', 'Practical tools for everyday clarity']
  }
];

const trustLinks = [
  {
    label: 'YouTube',
    href: 'https://youtube.com/@azhagapparacademy?si=CcLN6rGLkt-zT0tt',
    external: true
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/azhagappar_academy?igsh=MW43dWRxajdoNTlwMQ==',
    external: true
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/918870792608',
    external: true
  },
  {
    label: 'Email',
    href: 'mailto:Azhagapparmindmastery@gmail.com',
    external: true
  },
  {
    label: 'Call',
    href: 'tel:+918870792608',
    external: false
  }
];

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="wsp-page">
      <div className="wsp-grid-mask" />
      <div className="wsp-shell">
        <header className="wsp-nav wsp-rise" style={{ animationDelay: '0.03s' }}>
          <button type="button" className="wsp-brand" onClick={() => navigate('/welcome')}>
            <img src={academyLogo} alt="Azhagappar Academy logo" className="wsp-logo" />
            <div>
              <p className="wsp-brand-title">Azhagappar Academy</p>
              <p className="wsp-brand-sub">Mind | Body | Skills</p>
            </div>
          </button>

          <nav className="wsp-links">
            <a href="#about">About</a>
            <a href="#programs">Programs</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="wsp-nav-actions">
            <Button className="wsp-btn wsp-btn-outline" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button className="wsp-btn wsp-btn-primary" onClick={() => navigate('/register')}>
              Enroll
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </header>

        <main className="wsp-main">
          <section className="wsp-hero wsp-rise" style={{ animationDelay: '0.08s' }}>
            <div className="wsp-pill">
              <Sparkles className="w-4 h-4" />
              Trusted academy for mindful growth
            </div>

            <h1>Transform Your Mind and Body with Guided Growth</h1>
            <p>
              A focused and supportive academy experience for yoga, hypnosis, and personal mastery.
            </p>

            <div className="wsp-hero-actions">
              <Button className="wsp-btn wsp-btn-primary" onClick={() => navigate('/register')}>
                Get Started
              </Button>
              <a href="#programs">
                <Button className="wsp-btn wsp-btn-outline">View Programs</Button>
              </a>
            </div>

            <div className="wsp-note">
              <ShieldCheck className="w-4 h-4" />
              Private and beginner-friendly enrollment support.
            </div>
          </section>

          <section id="about" className="wsp-preview wsp-rise" style={{ animationDelay: '0.14s' }}>
            <article className="wsp-card wsp-focus-card">
              <p className="wsp-card-title">Daily Focus Ritual</p>
              <ul className="wsp-focus-list">
                <li>Morning breath and body warmup</li>
                <li>Mind reset with guided audio</li>
                <li>Evening gratitude reflection</li>
              </ul>
            </article>

            <article className="wsp-card wsp-center-card">
              <img src={academyLogo} alt="Academy highlight" />
              <div className="wsp-center-chip">Creating calm routines</div>
            </article>

            <article className="wsp-card wsp-plan-card">
              <p className="wsp-card-title">Transformation Path</p>
              <div className="wsp-mini-track">
                <div className="wsp-mini-head">
                  <span>Mind calmness</span>
                  <strong>80%</strong>
                </div>
                <div className="wsp-mini-rail">
                  <span style={{ width: '80%' }} />
                </div>
              </div>
              <div className="wsp-mini-track">
                <div className="wsp-mini-head">
                  <span>Body flexibility</span>
                  <strong>65%</strong>
                </div>
                <div className="wsp-mini-rail">
                  <span style={{ width: '65%' }} />
                </div>
              </div>
              <div className="wsp-mini-track">
                <div className="wsp-mini-head">
                  <span>Life discipline</span>
                  <strong>72%</strong>
                </div>
                <div className="wsp-mini-rail">
                  <span style={{ width: '72%' }} />
                </div>
              </div>
            </article>

            <article className="wsp-metric-card">
              <span>5x</span>
              <p>Build stronger consistency with structured sessions.</p>
            </article>
          </section>

          <section className="wsp-social wsp-rise" style={{ animationDelay: '0.18s' }}>
            <p>Trusted by learners growing with Azhagappar Academy.</p>
            <div className="wsp-social-row">
              {trustLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="wsp-social-link"
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noreferrer' : undefined}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </section>

          <section id="programs" className="wsp-programs wsp-rise" style={{ animationDelay: '0.22s' }}>
            <h2>Simple Programs. Strong Results.</h2>
            <p>Short, practical sessions designed for real personal progress.</p>

            <div className="wsp-program-grid">
              {programs.map((program) => (
                <article key={program.title} className="wsp-program-card">
                  <h3>{program.title}</h3>
                  <ul>
                    {program.points.map((point) => (
                      <li key={point}>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section id="contact" className="wsp-contact wsp-rise" style={{ animationDelay: '0.27s' }}>
            <h2>Start Your Journey Today</h2>
            <p>DM or WhatsApp us for schedule, pricing, and enrollment support.</p>
            <div className="wsp-contact-actions">
              <a href="https://wa.me/918870792608" target="_blank" rel="noreferrer">
                <Button className="wsp-btn wsp-btn-primary">
                  <PhoneCall className="w-4 h-4 mr-2" />
                  8870792608
                </Button>
              </a>
              <a href="mailto:Azhagapparmindmastery@gmail.com">
                <Button className="wsp-btn wsp-btn-outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Us
                </Button>
              </a>
            </div>
          </section>

          <footer className="wsp-footer">
            <p>(c) 2026 Azhagappar Academy | Mind | Body | Skills</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default WelcomeScreen;
