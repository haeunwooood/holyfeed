import os
import re
import glob

def convert_bible_format(input_dir, output_dir):
    # 변환된 파일을 저장할 폴더 생성
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # 1. '숫자 성경이름.txt' 형식의 파일 찾기 (예: 01 마태복음.txt)
    file_pattern = os.path.join(input_dir, "* *.txt")
    
    for file_path in glob.glob(file_pattern):
        filename = os.path.basename(file_path)
        
        # 정규식을 통해 숫자와 성경 이름 분리 (예: '01 마태복음.txt' -> '마태복음')
        match = re.match(r'\d+\s+(.+)\.txt', filename)
        if not match:
            continue
            
        book_name = match.group(1).strip()
        output_path = os.path.join(output_dir, f"{book_name}.txt")
        
        # 2. 인코딩 문제(외계어) 해결을 위해 CP949로 읽기
        try:
            with open(file_path, 'r', encoding='cp949') as f:
                lines = f.readlines()
        except UnicodeDecodeError:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
        # 3. 본문 파싱 (원문 삭제 없이 포맷만 변경)
        formatted_verses = []
        formatted_verses.append(f"--- {book_name} ---") # 기존 파일 시작 부분 포맷 맞춤
        
        # 쉬운성경의 '마1:1' 같은 절 시작 패턴 찾기
        verse_pattern = re.compile(r'^([가-힣]+)(\d+):(\d+)\s*(.*)')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            v_match = verse_pattern.match(line)
            if v_match:
                # 패턴에 맞는 경우(장/절이 있는 경우) 기존 성경 포맷으로 변경하여 저장
                # text 부분에 있는 <소제목> 등은 지우지 않고 원문 그대로 유지
                chapter = v_match.group(2)
                verse = v_match.group(3)
                text = v_match.group(4)
                
                formatted_verses.append(f"{book_name} {chapter}장 {chapter}:{verse}절: {text}")
            else:
                # 장/절 패턴이 없는 줄(독립된 소제목이나 안내 문구 등)은 원문 그대로 삽입
                formatted_verses.append(line)

        # 4. VSCode에서 정상적으로 읽히도록 UTF-8로 저장
        with open(output_path, 'w', encoding='utf-8') as f:
            for verse in formatted_verses:
                f.write(verse + '\n')
                
        print(f"✅ 변환 완료: {filename} -> {book_name}.txt")

# 스크립트 실행
if __name__ == "__main__":
    # 쉬운성경 파일들이 있는 원본 폴더 경로 (현재 폴더)
    input_directory = "./" 
    
    # 포맷이 맞춰진 새 파일들이 생성될 폴더 경로
    output_directory = "./converted_bible" 
    
    convert_bible_format(input_directory, output_directory)