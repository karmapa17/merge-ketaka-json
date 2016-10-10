Merge Ketaka JSON into Jiangkangyur XML

[raw data and issue from Lamalien](https://drive.google.com/folderview?id=0B3g92NNibDrQfmJWVHR3TUpSNFRpanRQS3RkZkp3UFBFTnV3dVpLaW55RFJXcU1rSTlkUHc&usp=sharing_eid)

[Slide](https://docs.google.com/presentation/d/1s11_T_H4JPHgV17RGpGAUmMRnmG-jSm-fu-uFuXXdlI/edit?usp=sharing)

[video1](https://www.youtube.com/watch?v=R1VN-DJf3Do)
[video2](https://www.youtube.com/watch?v=A2k74Civ9Ks)
[vidoe3](https://www.youtube.com/watch?v=4ZvYlH5TTSk)
[video4](https://www.youtube.com/watch?v=GKCmkwuD0xc)
first step
=====
input: ketaka_json_lst and jiangkangyur.kdb (used by ketaka)
output: lstfilename+".json"

    node gen lstfilename jiangkangyur201504


second step
=====
input: combined json, files in before_xml
output: merged_xml 

    node merge combined_json
