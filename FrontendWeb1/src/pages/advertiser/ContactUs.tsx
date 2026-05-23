import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ContactForm from "../../components/advertiser/ContactUs";

export default function ContactUs() {
  return (
    <>
      <PageMeta
        title="Contact Us"
        description="Contact page"
      />
      <PageBreadcrumb pageTitle="Contact Us" />

      <div className="flex justify-center mt-6">
        <div className="w-full max-w-5xl">
          <ContactForm />
        </div>
      </div>
    </>
  );
}
