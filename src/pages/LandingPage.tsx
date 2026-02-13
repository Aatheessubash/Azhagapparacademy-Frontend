import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Brain,
  HeartPulse,
  Leaf,
  Phone,
  Sparkles,
  Star
} from 'lucide-react';
import academyLogo from '../logo.jpg';
import './LandingPage.css';

const programs = [
  {
    title: 'Yoga and Mind-Body Wellness',
    description:
      'Calm your mind through mindful breathing, improve flexibility and strength, and support your overall well-being.',
    icon: Leaf
  },
  {
    title: 'Hypnosis and Mind Mastery',
    description:
      'Guided sessions focused on stress reduction, confidence, motivation, and supportive emotional balance.',
    icon: Brain
  },
  {
    title: 'Life Skills and Personal Growth',
    description:
      'Mind awareness, habit transformation, and practical tools to handle daily stress and improve performance.',
    icon: HeartPulse
  }
];

const whoCanJoin = [
  'Beginners and experienced practitioners',
  'Students, professionals, parents, and seniors',
  'Anyone seeking inner peace, focus, and skills growth'
];

const whyChooseUs = [
  'Personalized guidance',
  'Supportive learning environment',
  'Balanced mind and body transformation',
  'Certificates on program completion'
];

const testimonials = [
  {
    quote: 'Joining Azhagappar Academy changed how I manage stress and focus daily.',
    name: 'Member A',
    role: 'Program Participant'
  },
  {
    quote: 'The hypnosis training boosted my confidence and helped me stay calm under pressure.',
    name: 'Member B',
    role: 'Program Participant'
  }
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-root">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <header className="landing-rise flex items-center justify-between gap-4" style={{ animationDelay: '0.02s' }}>
          <div className="flex items-center gap-3">
            <img
              src={academyLogo}
              alt="Azhagappar Academy logo"
              className="h-10 w-10 rounded-xl object-cover border border-teal-200/80 bg-white p-0.5"
            />
            <div>
              <p className="landing-heading text-base font-bold">Azhagappar Academy</p>
              <p className="text-xs text-slate-600">Mind | Body | Skills</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" onClick={() => navigate('/login')} className="border-teal-700 text-teal-800">
              Login
            </Button>
            <Button onClick={() => navigate('/register')} className="bg-teal-700 hover:bg-teal-800">
              Join Now
            </Button>
          </div>
        </header>

        <section className="pt-12 sm:pt-16 lg:pt-20 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="landing-chip landing-rise inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-slate-700" style={{ animationDelay: '0.08s' }}>
                <Sparkles className="w-4 h-4 text-teal-700" />
                Transform Your Life | Yoga | Hypnosis | Personal Mastery
              </div>

              <h1 className="landing-heading landing-rise mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.06]" style={{ animationDelay: '0.14s' }}>
                Azhagappar Academy
                <span className="text-teal-700"> for Whole-Person Growth</span>.
              </h1>

              <p className="landing-rise mt-6 text-base sm:text-lg text-slate-700 max-w-xl" style={{ animationDelay: '0.2s' }}>
                We help you grow mentally, physically, and emotionally through yoga, guided hypnosis, and life-skills training.
                Our programs are designed for all ages to support focus, wellness, confidence, and personal transformation.
              </p>

              <div className="landing-rise mt-8 flex flex-col sm:flex-row gap-3 sm:items-center" style={{ animationDelay: '0.28s' }}>
                <a
                  href="https://wa.me/918870792608"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex"
                >
                  <Button className="h-11 px-6 bg-teal-700 hover:bg-teal-800">
                    WhatsApp to Join
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
                <a
                  href="https://www.instagram.com/azhagappar_academy?igsh=MW43dWRxajdoNTlwMQ=="
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex"
                >
                  <Button variant="outline" className="h-11 px-6 border-orange-400 text-orange-700 hover:bg-orange-50">
                    DM on Instagram
                  </Button>
                </a>
                <Button
                  onClick={() => navigate('/welcome')}
                  variant="outline"
                  className="h-11 px-6 border-teal-700 text-teal-800 hover:bg-teal-50"
                >
                  Explore
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="landing-rise mt-8 grid grid-cols-3 gap-3 max-w-md" style={{ animationDelay: '0.34s' }}>
                <div className="landing-chip rounded-xl p-3">
                  <p className="landing-heading text-xl font-bold text-teal-800">Yoga</p>
                  <p className="text-xs text-slate-600">Wellness</p>
                </div>
                <div className="landing-chip rounded-xl p-3">
                  <p className="landing-heading text-xl font-bold text-teal-800">Mind</p>
                  <p className="text-xs text-slate-600">Mastery</p>
                </div>
                <div className="landing-chip rounded-xl p-3">
                  <p className="landing-heading text-xl font-bold text-teal-800">Life</p>
                  <p className="text-xs text-slate-600">Skills</p>
                </div>
              </div>
            </div>

            <div className="landing-glow landing-rise relative" style={{ animationDelay: '0.18s' }}>
              <div className="landing-dot-bg absolute -inset-6 rounded-3xl" />
              <div className="landing-card relative rounded-3xl p-6 sm:p-8">
                <p className="text-sm font-semibold text-slate-500">Program Snapshot</p>
                <h3 className="landing-heading text-2xl font-bold mt-2 text-slate-900">Mind and Body Transformation</h3>

                <div className="mt-6 space-y-4">
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Yoga and Breathing Foundation</span>
                      <span className="font-semibold text-teal-700">Available</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full w-[90%] bg-teal-600" />
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Hypnosis and Confidence Sessions</span>
                      <span className="font-semibold text-orange-600">Ongoing</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full w-[70%] bg-orange-500" />
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Life Skills and Habit Mastery</span>
                      <span className="font-semibold text-slate-500">Next</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full w-[35%] bg-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="landing-float absolute -right-4 -bottom-5 landing-card rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold text-slate-800">Certificate on completion</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {programs.map((item, idx) => (
              <article
                key={item.title}
                className="landing-card rounded-2xl p-5 landing-rise"
                style={{ animationDelay: `${0.08 * (idx + 1)}s` }}
              >
                <div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <item.icon className="w-5 h-5" />
                </div>
                <h4 className="landing-heading mt-4 text-lg font-bold">{item.title}</h4>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="landing-card rounded-2xl p-6">
              <h3 className="landing-heading text-xl font-bold">Certificate and Achievements</h3>
              <p className="mt-3 text-slate-600">
                After completing our programs, you can download your training certificates directly.
                These certificates recognize your progress in yoga, mind mastery, and skills training.
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Certificate download link and steps will be provided once you complete your enrolled course.
              </p>
            </article>

            <article className="landing-card rounded-2xl p-6">
              <h3 className="landing-heading text-xl font-bold">Follow Our Social Channels</h3>
              <p className="mt-3 text-slate-600">
                Stay inspired and learn with us through free videos, guided classes, and wellness content.
              </p>
              <div className="mt-4 space-y-2">
                <a
                  href="https://youtube.com/@azhagapparacademy?si=CcLN6rGLkt-zT0tt"
                  target="_blank"
                  rel="noreferrer"
                  className="block text-teal-700 hover:underline break-all"
                >
                  YouTube: youtube.com/@azhagapparacademy
                </a>
                <a
                  href="https://www.instagram.com/azhagappar_academy?igsh=MW43dWRxajdoNTlwMQ=="
                  target="_blank"
                  rel="noreferrer"
                  className="block text-teal-700 hover:underline break-all"
                >
                  Instagram: instagram.com/azhagappar_academy
                </a>
              </div>
            </article>
          </div>
        </section>

        <section className="pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="landing-card rounded-2xl p-6">
              <h3 className="landing-heading text-xl font-bold">Who Can Join</h3>
              <ul className="mt-3 space-y-2 text-slate-600">
                {whoCanJoin.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </article>
            <article className="landing-card rounded-2xl p-6">
              <h3 className="landing-heading text-xl font-bold">Why Choose Us</h3>
              <ul className="mt-3 space-y-2 text-slate-600">
                {whyChooseUs.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testimonials.map((item) => (
              <blockquote key={item.name} className="landing-card rounded-2xl p-6">
                <p className="text-slate-700">"{item.quote}"</p>
                <footer className="mt-4">
                  <p className="landing-heading text-base font-semibold">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="pb-8">
          <div className="landing-card rounded-3xl p-7 sm:p-10 text-center bg-gradient-to-r from-teal-800 to-teal-700 text-white border-none">
            <h2 className="landing-heading text-3xl sm:text-4xl font-bold">Contact and Join Us</h2>
            <p className="mt-3 text-teal-50 max-w-2xl mx-auto">We are ready to support your journey. DM us for schedules, pricing, certificates, and enrollment.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://wa.me/918870792608" target="_blank" rel="noreferrer" className="inline-flex">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Phone className="w-4 h-4 mr-2" />
                  +91 88707 92608
                </Button>
              </a>
              <a href="mailto:Azhagapparmindmastery@gmail.com" className="inline-flex">
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  Azhagapparmindmastery@gmail.com
                </Button>
              </a>
            </div>
          </div>
        </section>

        <footer className="pb-8 text-center text-sm text-slate-600">
          <p>(c) 2026 Azhagappar Academy | Mind | Body | Skills</p>
          <p className="mt-1 text-xs text-slate-500">Crafting health, peace, and confidence in every life.</p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
