import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, User, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getBlogPost, getRelatedPosts } from "@/lib/blog-data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  
  if (!post) {
    return { title: "Blog Post Not Found | Aliice" };
  }

  return {
    title: `${post.title} | Aliice Blog`,
    description: post.excerpt,
    keywords: post.tags.join(", "),
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(post.relatedSlugs);

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logos/aliice-logo.png" alt="Aliice" width={100} height={32} className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/blog" className="text-sm font-medium text-slate-600 hover:text-slate-900">Back to Blog</Link>
            <Link href="/register" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Get Started</Link>
          </div>
        </div>
      </nav>

      <header className="py-12 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to all articles
          </Link>
          
          <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
            <span className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full font-medium">{post.category}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{post.readTime}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">{post.title}</h1>
          <p className="mt-4 text-lg text-slate-600">{post.excerpt}</p>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                <User className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <div className="font-medium text-slate-900">{post.author}</div>
                <div className="text-sm text-slate-500">{post.authorRole}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <Calendar className="h-4 w-4" />
              {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>

          {post.image && (
            <div className="mt-8 aspect-video relative rounded-2xl overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>
      </header>

      <article className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div 
            className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-6 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-6 prose-a:text-sky-600 prose-strong:text-slate-900 prose-ul:text-slate-600 prose-ul:my-6 prose-li:my-2" 
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />

          {/* CTA Button */}
          <div className="mt-12 p-8 bg-gradient-to-r from-sky-50 to-violet-50 rounded-2xl text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to get started?</h3>
            <p className="text-slate-600 mb-6">Join thousands of clinics using Aliice to streamline their practice.</p>
            <Link 
              href="/register" 
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-8 py-3 text-base font-semibold text-white hover:bg-sky-700 transition-colors shadow-lg shadow-sky-600/25"
            >
              Start Your Free Trial Today <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </article>

      <section className="py-12 bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white">Ready to Transform Your Clinic?</h2>
          <p className="mt-2 text-slate-300">Join hundreds of aesthetic practices using Aliice to streamline operations.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-slate-900 hover:bg-slate-100">
              Start Free Trial <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white hover:bg-white/10">
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>

      {relatedPosts.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`} className="group bg-white rounded-xl p-6 border border-slate-100 hover:shadow-lg transition-all">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{relatedPost.category}</span>
                  <h3 className="mt-3 font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">{relatedPost.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 line-clamp-2">{relatedPost.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Image src="/logos/aliice-logo.png" alt="Aliice" width={80} height={26} className="h-6 w-auto" />
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/">Home</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}