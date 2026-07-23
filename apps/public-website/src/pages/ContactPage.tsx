import { useState } from "react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { Textarea } from "@trustbank/shared-ui/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, ShieldAlert, Briefcase, Landmark, Building2, Lock } from "lucide-react";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { PageHero } from "@/components/public/PageHero";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@trustbank/shared-ui/components/Motion";
import { SectionHeader } from "@/components/public/SectionHeader";
import heroContact from "@/assets/hero-contact.jpg";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";

const routingDirectory = [
  {
    icon: Building2,
    title: "Commercial & Corporate Banking",
    phone: "+1 (800) 555-0199",
    email: "corporate@trustbank.com",
    desc: "Treasury management, commercial lending, and syndicated finance inquiries."
  },
  {
    icon: Briefcase,
    title: "Private Wealth Advisory",
    phone: "+1 (800) 555-0288",
    email: "wealth@trustbank.com",
    desc: "Direct line for existing Private Wealth and Family Office clients."
  },
  {
    icon: Landmark,
    title: "Retail Banking Support",
    phone: "+1 (800) 555-0377",
    email: "support@trustbank.com",
    desc: "General inquiries for standard checking, savings, and personal loans."
  },
  {
    icon: ShieldAlert,
    title: "Fraud & Security Desk",
    phone: "+1 (800) 555-0911",
    email: "security@trustbank.com",
    desc: "24/7 dedicated line for reporting lost cards or suspicious activity."
  }
];

const ContactPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.from('contact_messages').insert({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        department: formData.department,
        message: formData.message
      });

      if (error) throw error;
      
      toast({ title: "Secure Message Dispatched", description: "Your inquiry has been routed to the appropriate desk. Expect a response within 24 hours." });
      setFormData({ firstName: "", lastName: "", email: "", department: "", message: "" });
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message || "An error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHero 
        title="Institutional Contact Directory" 
        description="Direct communication channels connecting you with our dedicated portfolio coordinators, commercial banking officers, and 24/7 security desk." 
        image={heroContact} 
        primaryCtaText="Submit Secure Inquiry"
        primaryCtaLink="#consultation"
        secondaryCtaText="Corporate Directory"
        secondaryCtaLink="#directory"
        stats={[
          { value: "< 5 Min", label: "Average Response Time" },
          { value: "24/7", label: "Fraud Incident Line" },
          { value: "Secure", label: "End-to-End Encryption" },
          { value: "Global", label: "Client Support" }
        ]}
      />

      <section className="py-24 bg-background" id="directory">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Departmental Routing"
            title="Direct Contact Lines"
            description="Bypass automated systems. Connect directly with the specialized desk equipped to handle your specific financial requirements."
          />
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {routingDirectory.map((dept, idx) => (
              <StaggerItem key={dept.title}>
                <div className="bg-card rounded-2xl border border-muted/50 p-8 shadow-sm hover-lift transition-all h-full flex flex-col justify-between">
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                      <dept.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-poppins font-bold text-foreground mb-3 text-sm">{dept.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans mb-6">{dept.desc}</p>
                  </div>
                  <div className="space-y-2 border-t border-muted/50 pt-4">
                    <p className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {dept.phone}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" /> {dept.email}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section className="py-24 bg-surface border-y border-muted/50" id="consultation">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-16 items-start">
            <SlideUp className="md:col-span-3">
              <div className="bg-card rounded-2xl p-10 border border-muted/50 shadow-elevated">
                <div className="flex items-center gap-3 mb-2">
                  <Lock className="h-5 w-5 text-secondary" />
                  <h2 className="text-2xl font-poppins font-bold text-foreground">Secure Inquiry Form</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-8">This form utilizes TLS 1.3 encryption. Please do not include account numbers or social security details in initial communications.</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">First Name</label>
                      <Input name="firstName" value={formData.firstName} onChange={handleChange} required className="bg-background border-muted" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">Last Name</label>
                      <Input name="lastName" value={formData.lastName} onChange={handleChange} required className="bg-background border-muted" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">Email Address</label>
                      <Input type="email" name="email" value={formData.email} onChange={handleChange} required className="bg-background border-muted" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">Routing Department</label>
                      <select name="department" value={formData.department} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-primary file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-muted">
                        <option value="">Select Department...</option>
                        <option value="corporate">Commercial Banking</option>
                        <option value="wealth">Private Wealth Advisory</option>
                        <option value="retail">Retail Banking</option>
                        <option value="technical">Technical Support</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">Message Details</label>
                    <Textarea name="message" value={formData.message} onChange={handleChange} rows={6} required className="bg-background border-muted resize-none" />
                  </div>
                  
                  <Button type="submit" disabled={loading} className="w-full h-12 text-sm font-bold tracking-wider uppercase">
                    {loading ? "Encrypting & Discarding..." : "Transmit Secure Message"}
                  </Button>
                </form>
              </div>
            </SlideUp>

            <SlideUp delay={0.15} className="md:col-span-2">
              <div className="bg-card rounded-2xl p-10 border border-muted/50 shadow-elevated space-y-8 h-full">
                <h2 className="text-2xl font-poppins font-bold text-foreground mb-6 border-b pb-4 border-muted">Corporate Headquarters</h2>
                <div className="space-y-8">
                  {[
                    { icon: MapPin, label: "Registered Address", value: "100 Wall Street, Suite 4500\nNew York, NY 10005" },
                    { icon: Clock, label: "Trading Hours", value: "Market Days: 8:00 AM - 5:00 PM EST\nDigital Systems: 24/7/365" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex gap-5 items-start">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-poppins font-bold text-foreground text-sm uppercase tracking-wider mb-2">{label}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-12 pt-8 border-t border-muted/50">
                  <h3 className="font-poppins font-bold text-foreground text-sm uppercase tracking-wider mb-4">Press & Media Inquiries</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">For press releases, executive interviews, or media relations, please contact our corporate communications desk directly.</p>
                  <p className="text-sm font-bold text-primary">media@trustbank.com</p>
                </div>
              </div>
            </SlideUp>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background border-b border-muted/50">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Global Presence"
            title="Regional Headquarters"
            description="Our international network provides round-the-clock localized support for multinational corporate clients."
          />
          <FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto font-sans">
              {[
                { city: "London", desc: "Serving EMEA corporate banking and forex liquidity." },
                { city: "Singapore", desc: "APAC wealth management and Asian market operations." },
                { city: "Frankfurt", desc: "European Union treasury management and regulatory compliance." }
              ].map((region) => (
                <div key={region.city} className="bg-card p-8 rounded-2xl border border-muted/50 shadow-sm flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                    <Building2 className="h-5 w-5 text-secondary" />
                  </div>
                  <h4 className="font-poppins font-bold text-lg text-foreground mb-2">{region.city}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{region.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Disclosure Section */}
      <section className="py-8 bg-surface border-t border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] leading-relaxed text-muted-foreground max-w-5xl mx-auto text-justify font-sans">
            Important Communication Disclosures: Electronic mail (email) and web forms submitted through the public internet may not be completely secure against interception. Do not send sensitive personal information such as account numbers, Social Security numbers, or wire transfer instructions through these unauthenticated channels. TrustBank personnel will never request your online banking password or physical security token codes via email, text, or unsolicited telephone calls. If you receive a suspicious communication claiming to be from TrustBank, immediately contact the Fraud & Security Desk.
          </p>
        </div>
      </section>
    </>
  );
};

export default ContactPage;
