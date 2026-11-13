import re
import sys
import zlib


def decode_pdf_string(data: bytes) -> str:
    output: list[str] = []
    i = 0
    escapes = {
        ord("n"): "\n",
        ord("r"): "\r",
        ord("t"): "\t",
        ord("b"): "\b",
        ord("f"): "\f",
        ord("("): "(",
        ord(")"): ")",
        ord("\\"): "\\",
    }

    while i < len(data):
        char = data[i]
        if char == 92:
            i += 1
            if i >= len(data):
                break
            escaped = data[i]
            if escaped in escapes:
                output.append(escapes[escaped])
                i += 1
            elif 48 <= escaped <= 55:
                octal = bytes([escaped])
                i += 1
                for _ in range(2):
                    if i < len(data) and 48 <= data[i] <= 55:
                        octal += bytes([data[i]])
                        i += 1
                    else:
                        break
                value = int(octal, 8)
                if 32 <= value < 127:
                    output.append(chr(value))
            else:
                i += 1
        else:
            if 32 <= char < 127 or char in (10, 13):
                output.append(chr(char))
            i += 1
    return "".join(output)


def main() -> None:
    pdf_path = sys.argv[1]
    raw_pdf = open(pdf_path, "rb").read()
    text: list[str] = []

    for match in re.finditer(rb"stream\r?\n(.*?)\r?\nendstream", raw_pdf, re.S):
        try:
            stream = zlib.decompress(match.group(1))
        except zlib.error:
            continue

        if b"TJ" not in stream and b"Tj" not in stream:
            continue

        for array in re.findall(rb"\[(.*?)\]\s*TJ", stream, re.S):
            parts = re.findall(rb"\((?:\\.|[^\\)])*\)", array, re.S)
            value = "".join(decode_pdf_string(part[1:-1]) for part in parts)
            if value.strip():
                text.append(value.strip())

        for value in re.findall(rb"\((?:\\.|[^\\)])*\)\s*Tj", stream, re.S):
            decoded = decode_pdf_string(value[1:-1]).strip()
            if decoded:
                text.append(decoded)

    print("\n".join(text))


if __name__ == "__main__":
    main()
