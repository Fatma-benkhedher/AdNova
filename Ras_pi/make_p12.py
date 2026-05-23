from cryptography.hazmat.primitives.serialization import pkcs12, load_pem_private_key
from cryptography.x509 import load_pem_x509_certificate

with open("key.pem", "rb") as f:
    key = load_pem_private_key(f.read(), password=None)

with open("cert.pem", "rb") as f:
    cert = load_pem_x509_certificate(f.read())

p12 = pkcs12.serialize_key_and_certificates(
    name=b"AdPlayer",
    key=key,
    cert=cert,
    cas=None,
    encryption_algorithm=pkcs12.serialization.BestAvailableEncryption(b"1234")
)

with open("adplayer.p12", "wb") as f:
    f.write(p12)

print("adplayer.p12 créé avec succès !")