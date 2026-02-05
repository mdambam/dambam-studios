'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import {
  Check,
  Zap,
  Image as ImageIcon,
  Sparkles,
  Wand2,
  Shirt,
  Maximize2,
  ArrowRight,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const tools = [
    {
      href: '/generate',
      icon: ImageIcon,
      title: 'ImageGen',
      desc: 'Create stunning images from text descriptions',
      image: '/sample-fashion.png',
      color: 'from-purple-500/20 to-pink-500/20',
    },
    {
      href: '/enhance',
      icon: Sparkles,
      title: 'ImageEdit',
      desc: 'Transform photos with AI enhancement',
      color: 'from-blue-500/20 to-cyan-500/20',
    },
    {
      href: '/studio',
      icon: Shirt,
      title: 'Fabric Studio',
      desc: 'Create mannequin mockups with your fabric',
      color: 'from-emerald-500/20 to-teal-500/20',
    },
    {
      href: '/create',
      icon: Wand2,
      title: 'Style Transfer',
      desc: 'Apply artistic styles to your images',
      color: 'from-orange-500/20 to-amber-500/20',
    },
    {
      href: '/upscale',
      icon: Maximize2,
      title: 'Upscale',
      desc: 'Increase resolution without losing quality',
      color: 'from-rose-500/20 to-red-500/20',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f3f1e9]">
      {/* Hero Section */}
      <section className="bg-black text-white relative overflow-hidden">
        {/* Background Image / Gradient */}
        <div className="absolute inset-0 z-0 opacity-60">
          <img
            src="/hero-bg.png"
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        </div>

        <div className="container mx-auto px-6 py-20 lg:py-32 relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Hero Content */}
          <motion.div
            className="flex-1 max-w-2xl space-y-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#81b441]/20 text-[#81b441] border border-[#81b441]/30"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span className="text-sm font-bold tracking-wide uppercase">AI-Powered Creation</span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-[#81b441]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              CREATE WITH AI
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-gray-300 font-medium max-w-xl leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Generate, enhance, and transform images with D.AI Studios. Professional AI tools for creators.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 pt-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <Button
                className="h-14 px-8 text-lg font-bold bg-[#81b441] hover:bg-[#72a136] text-black shadow-lg shadow-[#81b441]/20 rounded-xl"
                onClick={() => router.push(user ? '/dashboard' : '/signup')}
              >
                {user ? 'Go to Dashboard' : 'Start Creating Free'}
              </Button>
              <Button
                variant="outline"
                className="h-14 px-8 text-lg font-bold border-white/30 text-white hover:bg-white/10 rounded-xl"
                onClick={() => router.push('/billing')}
              >
                View Pricing
              </Button>
            </motion.div>
          </motion.div>

          {/* Feature Card */}
          <motion.div
            className="w-full max-w-md shrink-0"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="bg-white text-black p-8 rounded-2xl shadow-2xl border border-gray-100">
              <div className="space-y-1 mb-6">
                <p className="text-sm text-gray-500 font-medium">What you get</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">Pay per use</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  'AI image generation',
                  'Photo enhancement & editing',
                  'Style transfer & mockups',
                  'Image upscaling',
                  'Credit-based system',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#81b441] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="font-medium text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full h-14 text-lg font-bold bg-black hover:bg-gray-800 text-white rounded-xl"
                onClick={() => router.push(user ? '/dashboard' : '/signup')}
              >
                {user ? 'Continue Creating' : 'Get Started Free'}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section className="py-20 container mx-auto px-6">
        <motion.h2
          className="text-4xl font-bold mb-12 text-gray-900"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          AI Tools Suite
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
        >
          {tools.map((tool, index) => (
            <motion.div
              key={tool.href}
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link
                href={tool.href}
                className="group relative aspect-[4/3] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 block bg-white"
              >
                {tool.image ? (
                  <img
                    src={tool.image}
                    alt={tool.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${tool.color}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2">
                  <tool.icon className="w-5 h-5 text-black" />
                  <span className="font-bold text-black">{tool.title}</span>
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {tool.desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.h2
            className="text-4xl font-bold mb-16 text-gray-900 text-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            How It Works
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Choose Your Tool',
                desc: 'Select from image generation, enhancement, style transfer, or upscaling.',
              },
              {
                step: '02',
                title: 'Upload or Describe',
                desc: 'Upload your image or describe what you want to create with text prompts.',
              },
              {
                step: '03',
                title: 'Get Results',
                desc: 'Our AI processes your request and delivers professional-quality results in seconds.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="text-center"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <span className="text-6xl font-bold text-[#81b441]/20">{item.step}</span>
                <h3 className="text-xl font-bold mt-4 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-black text-white py-20 border-t border-gray-800">
        <motion.div
          className="container mx-auto px-6 text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-6">Ready to create with AI?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Join thousands of creators using D.AI Studios for professional AI-powered image creation.
          </p>
          <Button
            className="h-14 px-8 text-lg font-bold bg-[#81b441] hover:bg-[#72a136] text-black rounded-full"
            onClick={() => router.push(user ? '/dashboard' : '/signup')}
          >
            {user ? 'Go to Dashboard' : 'Start Creating Now'} <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
