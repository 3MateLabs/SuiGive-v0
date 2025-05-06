"use client"

import { useInView } from "@/hooks/use-in-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Mail, Phone, MapPin } from "lucide-react"

export default function SupportSection() {
  const { ref, inView } = useInView()

  return (
    <section id="support" className="py-16 px-4 sm:px-6 lg:px-8">
      <div ref={ref} className={`max-w-7xl mx-auto animate-on-scroll ${inView ? "visible" : ""}`}>
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <div className="inline-block rounded-lg bg-black px-3 py-1 text-sm text-white mb-4">Support</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Need Help? We're Here For You</h2>
            <p className="text-gray-600 mb-8">
              Our team is dedicated to providing you with the best support possible. Whether you have questions about
              creating a project, making contributions, or technical issues, we're here to help.
            </p>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-gray-100 p-2 rounded-full mr-4">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold">Email Us</h3>
                  <p className="text-gray-600">support@3matelabs.com</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-gray-100 p-2 rounded-full mr-4">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold">Call Us</h3>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-gray-100 p-2 rounded-full mr-4">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold">Live Chat</h3>
                  <p className="text-gray-600">Available 24/7</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-gray-100 p-2 rounded-full mr-4">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold">Visit Us</h3>
                  <p className="text-gray-600">123 Blockchain Avenue, San Francisco, CA 94103</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glassmorphism rounded-xl p-6">
            <h3 className="text-xl font-bold mb-6">Send Us a Message</h3>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Name
                  </label>
                  <Input id="name" placeholder="Your name" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <Input id="email" type="email" placeholder="Your email" />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-1">
                  Subject
                </label>
                <Input id="subject" placeholder="How can we help?" />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">
                  Message
                </label>
                <Textarea id="message" placeholder="Tell us more about your inquiry..." rows={5} />
              </div>

              <Button className="w-full rounded-full bg-black text-white hover:bg-gray-800">Send Message</Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
