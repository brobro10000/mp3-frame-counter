# Private stage diagnostics

Failed Terraform commands can retain `private-command-failure.json` in the existing stage Actions artifact. Its bounded
stdout/stderr are encrypted for the owner using [recipient.json](recipient.json); raw output never enters CI logs. The
ordinary three-field `command-failure.json` and failed outcome remain available without decryption.

The recipient is a public RSA-3072 SPKI key, not a credential. Keep its matching private key outside the repository and
CI, in owner-controlled storage with restrictive permissions and an encrypted backup. CI and the companion reviewer
receive only the public key. Losing the private key makes earlier encrypted diagnostics unrecoverable. To rotate it,
review a replacement public recipient and retain the previous private key for the retained artifact window.

To inspect a failure, download the artifact from the exact source/run/attempt. In a private local operation, check the
record's context and recipient fingerprint, unwrap its key with RSA-OAEP SHA-256, and decrypt AES-256-GCM using the
ordered metadata as authenticated additional data. Write the result only to a private file; never paste raw output into
chat, PRs or logs. The [sealer](../../../scripts/stage-private-diagnostic.mjs) documents the record and serialization.
Its [independent tests](../../../scripts/stage-private-diagnostic.test.mjs) demonstrate decryption and tamper refusal
with synthetic input only.

Only positive failed Terraform exits produce this record, after private temporary storage is removed successfully.
Capture stdout's final 60 KiB and stderr's first 60 KiB, with explicit truncation flags. A missing or invalid recipient
keeps the operation failed and suppresses encrypted retention; it never exposes plaintext. Encryption failures do not
erase the ordinary closed diagnostic. Successful commands, other commands and signal/spawn failures produce no encrypted
record.

Encryption protects diagnostic confidentiality; it does not prove provider identity, authorize IAM changes or establish
deployment acceptance. Review the actual private error and provider evidence before changing access. See the
[deployment runbook](../../../docs/deployment/runbook.md#stage-configuration-and-log-privacy).
