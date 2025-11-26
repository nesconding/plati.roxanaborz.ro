<?php
 
 {
        $response = 'ljlPFYJnPM1QLZvkgjO+zq29ktIwSDNNDmM8tkgrrq92a5GMFRtdgagDuPfPZLXtY/jbzNSQ1i0VJRbwXlCQJi8ril5pey6QHIL4kotNwhpC8mNed7s1jDi3yKRAK/17dA9XmJADt2Ck0Kjh3C94yrvemG12gFpDwhDPC1qPJhVce+VUUbLNjrHMWU4y2aK/Dg/kyJXAuBE/SheRE5vyvcFTBaVh3qfH/ycvoe83VWfwHBaLePD7E3+BwfGe/kufTcgiaCCu1eKAPuAM5lAdC2JRKCD93xIYa/gc3YWcUFirCOnKe0IE0VTUqbRpRmdVsZeTGhsSVlAImGLN76fgWA=='; // ceea ce vine din post dupa prelucrarea cererii de credit

        // Get the private Key  'aaaaaa'
        
$strprivateKey = <<<EOD
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDtEwOLvJj26z7+
1QTyGs3fb+Yi1SwEOl4DE2BboM9E6S4CohORsKetwiUFX0Cs6stuVJIHBuSt//v6
KYSj/RhWUtC34+lxqaFOnXrdXGHl5ka3KGHKlAh+9Qi1YNrpaIq6qDTWHOof38zQ
hRGj57dbheM92RnAt7GHjGs7AIfkAvFE9hYOk7psnIfR3oU3C07VO4peyu9F1x4U
tfL9TFa39g9rm4imU30w6ypuIPvejZ8zO4spuBBuumiU69zjlRmKrnjQEtRQW1U7
m0eJ84l1MV/MSUoO0tC1p8jztmRHqy3sxlBhcmJrvRRJ+evoIBIozOGHNTSLq7kE
+99FO5bdAgMBAAECggEBANSLa25oU6tsFTpauOhl55UeuXEZNTFFMuwG/yim76yU
cc+ih3DitDIwEQjT8SQWDPSJlbH/GB53le0eM/DiBGPAM6fqCW0B68CTp4e2P37i
CRxEdAgu178a6AfVIe6I73eRPm2H1s9k0jdQVhRgth6z1puofFIvXlZsKebn/u0H
jJBHapAwNO6pfYoj9eVsC3vg7jQHwhPROIMPVMtEWNoxJxyrFB1otO40T2m20vzY
+ei7vPhdlPEaP4If86mRpxEJR3Ze1vc6ZEYl0C0x5WkELHm9V3MEKKa2Y6eVOa85
qlUpt3QonMtdJRtMdZ1L8I/4RKKaNzROf9u9FZMnbPECgYEA9/f38czCHjR43aSw
gE9Rl0ipLdHJsbYMtKEElqCUnhorpMiDpFZhzXl9paDuD+TUiPdjVsyrK9qrRwsp
KXg/xSjPhoQ7RqAIZ8UOQ3bSZqtLOEO4D6f7V1JfvYzahFGFW45ghrkaQ46qQrTm
FaGJ4DQJ0rycRA91Bt64wddsFz8CgYEA9MC2/PVrdbVU4WzEnUomf6hnBsQWEz+S
lq0nVOREiffMMENDvL+i+KhP9CzVhaPAM/DqFAi4+KlBTbdsnbtxsxv3ND7QMWp3
cQHg8Gcfl0PIm4IuREgnFjW/CFxYkRSUcq05adAUbRAp+nvjHytf83oihpiwSPlA
jzbHob3IhuMCgYBRAvdDTRUCTzxJlTuAv+k1Fq0G5ioR4BsojA52s4G6YWxuyn+P
mhUbzxxIl1oPYUA6ezA+NGGb0zXv4OqSvNGAtUOPe/XtrezxEgUF73Tvy/ioKh+h
Jc1MiwHyaGkfn46FCe/pM+IrvhlL79PXr03fLMEk0y/uYGpoUy1jTuDmewKBgGvd
nwfe1Ww77VuoBwLXEh6Cxl0aACydgOo9B6+HJpmzht7iVjESOC3kZ9BSDgxmvadm
jpMjwPl+BpTMuObPHG32bj0tTa3poRhB3rO0jxyoN/opJmDbd7Z3G2kA4duWuVHM
/BehJ89lJ0sIXHF5OUFh22N8WXzftM8pMlQbAwxHAoGBAOOsAYi0aW2upfNX7xs9
2ZBjEq0XMIDEULHX/Hs4yC+NIMocicCibbWlt9bGDmhdUJUEVzYN9UlYLfBXSY0Y
5y3zWlj0hMQm1tEGHVH+RqSS/rbcJ6gzBLmjIHcV0UjohloWB+RaiA1cfC+I2eMP
BKYQfzWywckxS/S9gYopfqqK
-----END PRIVATE KEY-----
EOD;
        $privateKey = openssl_pkey_get_private($strprivateKey);
        $a_key = openssl_pkey_get_details($privateKey); 

        // Decrypt the data in the small chunks 
        $chunkSize = ceil($a_key['bits'] / 8); 

        $output = ''; 
        $encrypted = base64_decode($response); 

        while ($encrypted) { 
            $chunk = substr($encrypted, 0, $chunkSize); 
            $encrypted = substr($encrypted, $chunkSize); 
            $decrypted = '';

            if (!openssl_private_decrypt($chunk, $decrypted, $privateKey)) { 
                die('Failed to decrypt data'); 
                $output = $decrypted; 
            } 
            openssl_free_key($privateKey); 
        }
        var_dump($decrypted);

    }