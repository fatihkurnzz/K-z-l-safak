# 3B Savaş Faz 1 · Meshy / Mixamo model işleme hattı (başsız Blender, bpy).
#
# Kurulum (bulut konteynerinde, kullanıcının bilgisayarı gerekmez):
#   python3 -m venv /tmp/bpyenv && /tmp/bpyenv/bin/pip install bpy==5.3.*      (Python sürümü bpy'nin istediği olmalı)
# Kullanım:
#   /tmp/bpyenv/bin/python donustur.py <girdi.fbx|.glb|.gltf> <çıktı.glb> [--ucgen 15000] [--doku 1024] [--boy 2.3]
#                                       [--kaynak meshy|mixamo|otomatik] [--rapor rapor.json]
# Yaptıkları (sırayla):
#   1. Girdiyi içe aktarır (Mixamo FBX: "T-pose, with skin"; Meshy GLB/FBX: dokulu, iskeletli ya da iskeletsiz).
#   2. İskeleti bulur; kemik adlarını ortak iskelete çevirir: mixamorig:Hips … (Meshy/Unreal/Blender Rigify adları KEMIK tablosunda).
#      Eşlenemeyen zorunlu kemik varsa durur (raporda 'eksik_kemik'): o model oyunun 11 klibini oynatamaz.
#   3. Ölçek ve dönüşleri uygular, modeli ayakları y=0'da, +Y yukarı, +Z ileri olacak biçimde yerleştirir (glTF kuralı).
#   4. Ağı hedef üçgen sayısına indirir (Decimate, oran = hedef / mevcut; deri ağırlıkları korunur).
#   5. Köşe başına etkiyi 4 kemiğe sınırlar ve ağırlıkları normalize eder.
#   6. Dokuları en uzun kenar ≤ --doku olacak biçimde küçültür, WebP olarak gömer.
#   7. Animasyonsuz, deri + iskelet içeren tek .glb yazar (klipler oyunun ortak models/anims dosyalarından gelir).
#   8. Rapor (JSON): üçgen önce/sonra, kemik eşlemesi, doku boyutları, uyarılar.
# Sonra: node butce.mjs <çıktı.glb> --tur kahraman  →  models/b3d/models3d.json'a kayıt  →  vitrin.html ile 11 klip denetimi.
# NOT (27.11): Bu betik yazıldı, Blender ile henüz çalıştırılmadı (kullanıcı onayı olmadan test yapılmadı). İlk Meshy pilotunda denenecek.
import sys, os, json, argparse

ZORUNLU = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head',
           'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
           'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot']
# Bilinen adlandırmalar → ortak ad (mixamorig: öneki eklenir). Küçük/büyük harf ve '_', '.', ' ' farkı yok sayılır.
KEMIK = {
    'hips': 'Hips', 'pelvis': 'Hips', 'root_hips': 'Hips',
    'spine': 'Spine', 'spine01': 'Spine1', 'spine1': 'Spine1', 'spine02': 'Spine2', 'spine2': 'Spine2', 'chest': 'Spine2', 'spine03': 'Spine2', 'upperchest': 'Spine2',
    'neck': 'Neck', 'neck01': 'Neck', 'head': 'Head', 'headtop_end': 'HeadTop_End',
    'leftshoulder': 'LeftShoulder', 'lshoulder': 'LeftShoulder', 'clavicle_l': 'LeftShoulder', 'shoulderl': 'LeftShoulder',
    'leftarm': 'LeftArm', 'leftupperarm': 'LeftArm', 'upperarm_l': 'LeftArm', 'upper_arml': 'LeftArm',
    'leftforearm': 'LeftForeArm', 'leftlowerarm': 'LeftForeArm', 'lowerarm_l': 'LeftForeArm', 'forearml': 'LeftForeArm',
    'lefthand': 'LeftHand', 'hand_l': 'LeftHand', 'handl': 'LeftHand',
    'rightshoulder': 'RightShoulder', 'rshoulder': 'RightShoulder', 'clavicle_r': 'RightShoulder', 'shoulderr': 'RightShoulder',
    'rightarm': 'RightArm', 'rightupperarm': 'RightArm', 'upperarm_r': 'RightArm', 'upper_armr': 'RightArm',
    'rightforearm': 'RightForeArm', 'rightlowerarm': 'RightForeArm', 'lowerarm_r': 'RightForeArm', 'forearmr': 'RightForeArm',
    'righthand': 'RightHand', 'hand_r': 'RightHand', 'handr': 'RightHand',
    'leftupleg': 'LeftUpLeg', 'leftupperleg': 'LeftUpLeg', 'thigh_l': 'LeftUpLeg', 'thighl': 'LeftUpLeg',
    'leftleg': 'LeftLeg', 'leftlowerleg': 'LeftLeg', 'calf_l': 'LeftLeg', 'shinl': 'LeftLeg',
    'leftfoot': 'LeftFoot', 'foot_l': 'LeftFoot', 'footl': 'LeftFoot', 'lefttoebase': 'LeftToeBase', 'ball_l': 'LeftToeBase', 'lefttoe': 'LeftToeBase',
    'rightupleg': 'RightUpLeg', 'rightupperleg': 'RightUpLeg', 'thigh_r': 'RightUpLeg', 'thighr': 'RightUpLeg',
    'rightleg': 'RightLeg', 'rightlowerleg': 'RightLeg', 'calf_r': 'RightLeg', 'shinr': 'RightLeg',
    'rightfoot': 'RightFoot', 'foot_r': 'RightFoot', 'footr': 'RightFoot', 'righttoebase': 'RightToeBase', 'ball_r': 'RightToeBase', 'righttoe': 'RightToeBase',
}
import re
sade = lambda s: re.sub(r'^mixamorig[:_]?', '', s.split(':')[-1] if ':' in s else s, flags=re.I).replace(' ', '').replace('.', '').replace('-', '').lower()
ORTAK = {v.lower(): v for v in set(KEMIK.values())}  # zaten ortak adla gelen kemik (mixamorigHips, Hips…)

def main():
    a = argparse.ArgumentParser()
    a.add_argument('girdi'); a.add_argument('cikti')
    a.add_argument('--ucgen', type=int, default=15000); a.add_argument('--doku', type=int, default=1024)
    a.add_argument('--boy', type=float, default=2.3); a.add_argument('--kaynak', default='otomatik')
    a.add_argument('--rapor', default=None)
    arg = a.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])
    import bpy
    R = {'girdi': os.path.basename(arg.girdi), 'uyari': [], 'esleme': {}, 'eksik_kemik': []}

    bpy.ops.wm.read_factory_settings(use_empty=True)
    uz = arg.girdi.lower()
    if uz.endswith('.fbx'): bpy.ops.import_scene.fbx(filepath=arg.girdi, automatic_bone_orientation=False, ignore_leaf_bones=True)
    elif uz.endswith(('.glb', '.gltf')): bpy.ops.import_scene.gltf(filepath=arg.girdi)
    else: raise SystemExit('desteklenmeyen girdi: ' + arg.girdi)

    # Animasyonlar atılır (ortak klipler kullanılır)
    for ob in bpy.data.objects:
        if ob.animation_data: ob.animation_data_clear()
    for ac in list(bpy.data.actions): bpy.data.actions.remove(ac)

    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE']
    agl = [o for o in bpy.data.objects if o.type == 'MESH']
    if not agl: raise SystemExit('ağ yok')
    if len(arm) != 1:
        R['uyari'].append(f'iskelet sayısı {len(arm)} (1 olmalı). İskeletsiz Meshy çıktısı önce Mixamo ya da Meshy rig ile iskeletlendirilmeli.')
        return bitir(R, arg)
    arm = arm[0]

    # 2. Kemik adları
    for b in arm.data.bones:
        yeni = KEMIK.get(sade(b.name)) or ORTAK.get(sade(b.name))
        if yeni:
            R['esleme'][b.name] = 'mixamorig:' + yeni
            b.name = 'mixamorig:' + yeni
    adlar = {b.name for b in arm.data.bones}
    R['eksik_kemik'] = [k for k in ZORUNLU if 'mixamorig:' + k not in adlar]
    if R['eksik_kemik']: R['uyari'].append('zorunlu kemik eşlenemedi: ' + ', '.join(R['eksik_kemik']) + ' (KEMIK tablosuna ekleyin ya da manifestte kemikHaritasi verin)')
    # Ağların köşe grupları kemik adlarını izler (Blender yeniden adlandırmada grupları da günceller)

    # 3. Dönüşümleri uygula ve boyu normalize et
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    import mathutils
    kose = [o.matrix_world @ v.co for o in agl for v in o.data.vertices]
    zmin = min(p.z for p in kose); zmax = max(p.z for p in kose)
    k = arg.boy / max(1e-6, zmax - zmin)
    arm.scale = (k, k, k); arm.location.z -= zmin * k
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=True)
    R['boy_carpani'] = round(k, 5)

    # 4. Üçgen azaltma
    def ucgen():
        n = 0
        for o in agl:
            o.data.calc_loop_triangles(); n += len(o.data.loop_triangles)
        return n
    R['ucgen_once'] = once = ucgen()
    if once > arg.ucgen:
        oran = arg.ucgen / once
        for o in agl:
            m = o.modifiers.new('azalt', 'DECIMATE'); m.ratio = oran; m.use_collapse_triangulate = True
            bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=m.name)
    R['ucgen_sonra'] = ucgen()

    # 5. Köşe başına en çok 4 etki
    for o in agl:
        bpy.context.view_layer.objects.active = o
        try:
            bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4)
            bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
        except Exception as e: R['uyari'].append('ağırlık sınırlama: ' + str(e))

    # 6. Doku küçültme
    R['doku'] = []
    for im in bpy.data.images:
        if im.size[0] == 0: continue
        w, h = im.size; s = min(1.0, arg.doku / max(w, h))
        if s < 1: im.scale(max(1, int(w * s)), max(1, int(h * s)))
        R['doku'].append({'ad': im.name, 'once': [w, h], 'sonra': list(im.size)})

    # 7. Dışa aktar: GLB, deri + iskelet, animasyon yok, WebP doku, Draco/meshopt YOK (oyunda çözücü yok)
    bpy.ops.export_scene.gltf(filepath=arg.cikti, export_format='GLB', export_skins=True, export_animations=False,
                              export_image_format='WEBP', export_yup=True, export_apply=False, export_draco_mesh_compression_enable=False)
    R['cikti'] = arg.cikti; R['boyut_MB'] = round(os.path.getsize(arg.cikti) / 1048576, 2)
    return bitir(R, arg)

def bitir(R, arg):
    s = json.dumps(R, ensure_ascii=False, indent=1)
    if arg.rapor: open(arg.rapor, 'w', encoding='utf-8').write(s)
    print(s)
    return 1 if R['uyari'] and R.get('eksik_kemik') else 0

if __name__ == '__main__':
    sys.exit(main())
