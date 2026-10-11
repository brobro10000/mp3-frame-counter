/**
 * Declare the fixed public recipient for owner-encrypted stage command diagnostics.
 * Imported by stage-delivery.mjs; schemaVersion and the bounded RSA SPKI public key are its only inputs.
 * This inert declaration performs no I/O and contains no private key or credential.
 * Invalid data prevents diagnostic sealing; an unavailable export prevents controller startup.
 * Rotate through an independently reviewed PR and preserve the corresponding private keys outside Git.
 */
export const stageDiagnosticRecipient = Object.freeze({
  schemaVersion: 1,
  publicKey:
    "-----BEGIN PUBLIC KEY-----\nMIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAtx+gNFT2DaPV8qjVeyVW\nDHz952Yub/eOD4UX4ARFhWv0ndoeTA1ikSLBWkVAT05ATZC/qEzFguIpZ0WBsIF1\ndMrdI2Mp/2CRxCPtLBJK1XtNsuwX0Fl6UdmyFqMpZQOeDQNH9jDJnNFnbqxHsYZX\nSMcrYM1BrPwf0e8o7o1nhegM+LeMwqaOwn2dxUOianEu2vP9Ws16dnBaPaX5UmQL\nzggJWzwDKwR9QwXXB4HKFs3jJsucXH/jWiXdIOzcXvJRaI1Zf4ra+KCNghhjBrIg\nVbhIrz+vBvYoF0mRXDmwcSsOXwFVt7pd1OGEQTGhqYn04zRZf+t29hrKrfwGrZs1\n/3Tl0mZmko0OKlpUUZPoewQnL7T4+J8hFk1/huVutGZSlgy8RmOm/k/eepLqq4rH\n3XPzNEzho0F/OaHCFZrSS70gDDhjDV5ud3V3XnKfo/s2gL6GyVVkkJepufgbAYWv\nQ+Yc+yjMdd/KpWqt5MvmiaU0QallYFHGvM+d11H0/zmFAgMBAAE=\n-----END PUBLIC KEY-----\n",
});
