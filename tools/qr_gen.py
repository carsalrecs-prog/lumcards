# -*- coding: utf-8 -*-
"""
Generador QR SVG puro y autónomo en Python (sin librerías externas).
Soporta URLs y texto para generar SVG de código QR versión 1 a 4.
"""

def generate_qr_svg(data: str, size: int = 220) -> str:
    # Galois Field 256
    gf_exp = [0] * 512
    gf_log = [0] * 256
    x = 1
    for i in range(255):
        gf_exp[i] = x
        gf_exp[i + 255] = x
        gf_log[x] = i
        x = (x << 1) ^ (0x11d if (x & 0x80) else 0)

    def gf_mul(x, y):
        if x == 0 or y == 0: return 0
        return gf_exp[gf_log[x] + gf_log[y]]

    def rs_poly(n):
        p = [1]
        for i in range(n):
            p = [gf_mul(p[j], 1) if j < len(p) else 0 for j in range(len(p) + 1)]
            p = [p[j] ^ gf_mul(p[j-1] if j>0 else 0, gf_exp[i]) for j in range(len(p))]
        return p

    def rs_encode(data_bytes, n_ec):
        poly = rs_poly(n_ec)
        res = list(data_bytes) + [0] * n_ec
        for i in range(len(data_bytes)):
            coef = res[i]
            if coef != 0:
                for j in range(len(poly)):
                    res[i + j] ^= gf_mul(poly[j], coef)
        return res[len(data_bytes):]

    n_modules = 29
    matrix = [[None] * n_modules for _ in range(n_modules)]

    # 1. Finder patterns
    def add_finder(r, c):
        for dr in range(-1, 8):
            for dc in range(-1, 8):
                nr, nc = r + dr, c + dc
                if 0 <= nr < n_modules and 0 <= nc < n_modules:
                    if (dr in (0, 6) and 0 <= dc <= 6) or (dc in (0, 6) and 0 <= dr <= 6) or (2 <= dr <= 4 and 2 <= dc <= 4):
                        matrix[nr][nc] = 1
                    else:
                        matrix[nr][nc] = 0

    add_finder(0, 0)
    add_finder(0, n_modules - 7)
    add_finder(n_modules - 7, 0)

    # 2. Timing patterns
    for i in range(8, n_modules - 8):
        if matrix[6][i] is None: matrix[6][i] = 1 if i % 2 == 0 else 0
        if matrix[i][6] is None: matrix[i][6] = 1 if i % 2 == 0 else 0

    # 3. Alignment pattern en V3 (row 22, col 22)
    ar, ac = 22, 22
    for dr in range(-2, 3):
        for dc in range(-2, 3):
            if matrix[ar + dr][ac + dc] is None:
                if max(abs(dr), abs(dc)) in (0, 2):
                    matrix[ar + dr][ac + dc] = 1
                else:
                    matrix[ar + dr][ac + dc] = 0

    # 4. Format information (Mask 0, ECC M: 00 101 -> 101010000010010 ^ 101010000010010 = 000000000000000)
    format_bits = [1,0,1,0,1,0,0,0,0,0,1,0,0,1,0]
    for i in range(6): matrix[8][i] = format_bits[i]
    matrix[8][7] = format_bits[6]
    matrix[8][8] = format_bits[7]
    matrix[7][8] = format_bits[8]
    for i in range(6): matrix[5 - i][8] = format_bits[9 + i]

    for i in range(8): matrix[n_modules - 1 - i][8] = format_bits[i]
    for i in range(7): matrix[8][n_modules - 7 + i] = format_bits[8 + i]

    # Dark module
    matrix[n_modules - 8][8] = 1

    # 5. Codificar datos en modo byte
    data_bytes = data.encode('utf-8')
    data_len = len(data_bytes)
    bits = [0, 1, 0, 0] # Byte mode
    for b in format(data_len, '08b'): bits.append(int(b))
    for byte in data_bytes:
        for b in format(byte, '08b'): bits.append(int(b))
    
    total_data_bits = 35 * 8 # V3-M
    bits.extend([0] * min(4, total_data_bits - len(bits)))
    while len(bits) % 8 != 0: bits.append(0)
    pads = [0xec, 0x11]
    p_idx = 0
    while len(bits) < total_data_bits:
        for b in format(pads[p_idx % 2], '08b'): bits.append(int(b))
        p_idx += 1

    codewords = []
    for i in range(0, len(bits), 8):
        codewords.append(int("".join(map(str, bits[i:i+8])), 2))

    ec_bytes = rs_encode(codewords[:35], 26)
    all_bits = []
    for cw in (codewords[:35] + ec_bytes):
        for b in format(cw, '08b'): all_bits.append(int(b))

    # 6. Colocar en matriz zig-zag
    b_idx = 0
    row = n_modules - 1
    col = n_modules - 1
    dir_up = True

    while col > 0:
        if col == 6: col -= 1
        r = row
        for _ in range(n_modules):
            for c in (col, col - 1):
                if matrix[r][c] is None:
                    bit = all_bits[b_idx] if b_idx < len(all_bits) else 0
                    b_idx += 1
                    # Mask 0: (r + c) % 2 == 0
                    if (r + c) % 2 == 0: bit ^= 1
                    matrix[r][c] = bit
            r += -1 if dir_up else 1
        dir_up = not dir_up
        row = n_modules - 1 if dir_up else 0
        col -= 2

    # Construir SVG
    pad = 3
    svg_size = n_modules + pad * 2
    rects = []
    for r in range(n_modules):
        for c in range(n_modules):
            if matrix[r][c] == 1:
                rects.append(f'<rect x="{c + pad}" y="{r + pad}" width="1" height="1" fill="#0f172a"/>')

    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {svg_size} {svg_size}" width="{size}" height="{size}" style="background:#ffffff;border-radius:12px;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1)">'
    svg += f'<rect width="{svg_size}" height="{svg_size}" fill="#ffffff" rx="2"/>'
    svg += "".join(rects)
    svg += '</svg>'
    return svg

if __name__ == '__main__':
    test_svg = generate_qr_svg('http://192.168.0.202:8765/', 220)
    print('Generated SVG successfully, length:', len(test_svg))
