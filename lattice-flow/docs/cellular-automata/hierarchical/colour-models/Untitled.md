The provided research papers explore various facets of color science, ranging from human perception and natural scene statistics to advanced computational models in quantum computing and deep learning.

### Human perception and color models

A comparative analysis evaluates prominent color models—including **RGB**, **HSV**, **HSL**, **XYZ**, **CIELAB**, and **CIELUV**—to assess their alignment with human visual perception. Findings indicate that **HSL** and **HSV** demonstrate the highest correlation with human perception, while standard **RGB** models and certain **CIE** distance formulas (like **CIEDE2000**) may not consistently match how people see colors.

Additional research into color harmony challenges traditional assumptions of universal rules. A data-driven study using **HSL** palettes reveals that:

- **Hue dependence**: Pairing preferences are highly dependent on specific hues rather than just angular distance on a color wheel.
    
- **Natural alignment**: Human aesthetic preferences for color pairings strikingly align with hue distributions found in natural landscapes.
    
- **Complementary groups**: Principal component analysis uncovers two main hue groups whose interplay underlies global preference structures.
    

### Statistics of natural scenes

Further investigation into the connection between color perception and the environment demonstrates that "unique hues" (red, green, blue, and yellow) emerge from the sparse coding of color in natural scenes. Key insights include:

- **Non-Gaussian distribution**: Analysis of simulated cone responses reveals a strongly non-Gaussian distribution in 3D color space with heavy tails in distinct directions.
    
- **Sparse coding convergence**: A six basis-vector sparse coding model converges directly to the four unique hues plus black and white.
    
- **Opponent interactions**: The model's nonlinear inference naturally enforces mutual exclusivity between opposite unique hues (e.g., red-green), mimicking human phenomenology.
    

### Advanced computational architectures

The research also extends into specialized color representations for emerging technologies:

- **Quantum HSL (QHSL)**: A proposed model for quantum image processing encodes hue and saturation as amplitude angles of a qubit, with lightness stored as a qubit sequence. This allows for efficient storage, chromatic transformation, and pseudocolor applications using quantum mechanics properties like entanglement and parallelism.
    
- **Hypertoroidal Color Equivariant Network ($\mathbb{T}^{3}CEN$)**: This architecture addresses performance drops in neural networks when input color distributions change. By lifting interval-valued quantities like saturation and luminance to a "double-cover" circle, the network achieves perfect equivariance to HSL shifts.
    
- **Latent Color Subspace (LCS)**: Researchers have identified a 3D subspace within the Variational Autoencoder (VAE) latent space of the **FLUX.1** text-to-image model. This subspace mirrors **HSL** geometry, enabling training-free, mechanistic control and observation of color directly in the latent space during image generation.

---

The research materials provide a comprehensive look at how human color perception is understood through various color models, from classical spaces to modern computational and quantum representations.

### Comparative effectiveness of color models

Research comparing common color models like **RGB**, **HSV**, **HSL**, **XYZ**, **CIELAB**, and **CIELUV** reveals significant differences in how they align with human vision.

- **HSL and HSV**: These cylindrical models demonstrate the highest correlation with human perception (0.72 for HSL and 0.60 for HSV), making them highly effective for applications where consistent color judgment is required.
    
- **RGB limitations**: Standard RGB is widely used in graphics but is incapable of accurately representing human color perception due to the high correlation between its components and light intensity.
    
- **Uniformity challenges**: Models like **CIELAB** were designed for perceptual uniformity, but advanced distance metrics like **CIEDE2000** can still show negative correlations with human perception in certain scenarios, such as judging subtle differences in blue or gray.
    

### Color harmony and natural statistics

Quantitative analysis suggests that human aesthetic preferences for color pairings are not governed by universal rules but are deeply linked to the environment.

- **Hue dependence**: Pairing preferences depend heavily on specific hues rather than just the angular distance between them on a color wheel.
    
- **Ecological alignment**: Human preferences for harmonious colors (such as blue and orange–yellow) align strikingly with the distribution of hues found in natural landscapes, suggesting aesthetics are shaped by environmental exposure.
    
- **Dominant hue contrasts**: Natural scenes are often characterised by strong color contrasts (~180° separation), a pattern that mirrors human preference for high-contrast pairings.
    

### Emergence of "unique hues"

A connection exists between the statistics of natural scenes and the "unique hues" (red, green, blue, and yellow) that form the basis of human color phenomenology.

- **Sparse coding**: When a sparse coding model is applied to cone response data from natural scenes, a configuration of six basis vectors converges directly to the four unique hues plus black and white.
    
- **Color opponency**: The model's nonlinear inference naturally enforces mutual exclusivity between opponent pairs (like red–green and blue–yellow), even though these pairs are not collinear in cone-opponent space.
    
- **Non-Gaussian distribution**: Saturated colors in natural scenes occur more frequently than expected by chance, forming "heavy tails" in specific directions that the visual system appears to exploit for efficient coding.
    

### Advanced computational representations

Modern research has identified **HSL**-like structures within complex computational systems:

- **Latent color subspace (LCS)**: Within the high-dimensional latent space of the **FLUX.1** text-to-image model, color is confined to a 3D subspace that mirrors HSL geometry (hue as an angle, saturation as radius, and lightness as an axis).
    
- **Quantum HSL (QHSL)**: This model encodes color attributes using quantum mechanical properties, storing hue and saturation as amplitude angles of a qubit and lightness as a qubit sequence for efficient processing.
    
- **Hypertoroidal networks ($\mathbb{T}^3CEN$)**: This architecture achieves perfect color equivariance by lifting HSL interval values (saturation and luminance) to circular manifolds, preventing the performance drops conventional neural networks face when input colors change.

---

The **statistics of natural scenes** provide a foundational framework for understanding how human color perception and aesthetic preferences have evolved in response to environmental regularities. Research utilizing large-scale datasets of natural imagery reveals highly structured, non-Gaussian patterns in color distribution that align with biological and psychological phenomena.

### Datasets and sampling

To capture the full complexity of the natural visual environment, researchers have analyzed extensive composite datasets:

- One study utilized a collection of over 225 million simulated cone activations derived from 503 calibrated natural images across diverse global locations, including Japan, Spain, and Australia.
    
- To avoid confounding factors, images containing man-made objects were excluded, as their colors might inherit the very human perceptual biases being studied.
    
- Other investigations analyzed 12,000 landscape images spanning various biomes such as coasts, forests, glaciers, and mountains to identify dominant hue occurrences.
    

### Distributional characteristics of color

The joint activations of long-, medium-, and short-wavelength (LMS) cones in response to natural scenes exhibit a distinct three-dimensional structure:

- **Anisotropy**: The distribution is strongly asymmetrical; the variance along the achromatic (lightness) axis is more than 10-fold greater than the variance along chromatic axes.
    
- **Non-Gaussianity**: Natural color distributions deviate significantly from a standard Gaussian (random) process.
    
- **Achromatic structure**: The distribution along the achromatic axis is mildly sub-Gaussian, characterized by a negative excess kurtosis of -0.6.
    
- **Chromatic structure**: Conversely, chromatically sensitive dimensions show a "heavy-tailed" structure, meaning saturated colors occur with far greater frequency than would be expected by chance.
    

### Chromatic structure and heavy tails

Detailed analysis of the chromatic plane reveals that the frequency of saturated colors is highly dependent on the hue angle:

- **Directional peaks**: Strong heavy tails are observed in specific directions, notably along the L–M axis (with an excess kurtosis of 27.0) and the 2S–(L+M) axis (kurtosis of 4.3).
    
- **Persistence**: These heavy-tailed structures are a persistent property of the natural environment, surviving across different datasets and camera types.
    
- **Environmental drivers**: This structure is likely driven by the presence of chromatically consistent objects such as sky, foliage, and fruit.
    
- **Emergence of unique hues**: When sparse coding models are adapted to these statistics, the basis vectors naturally converge to the "unique hues" of red, green, blue, and yellow.
    

### Landscape hue statistics

The distribution of hues in natural landscapes directly correlates with human aesthetic judgment:

- **Hue peaks**: Natural scenes are dominated by blue and orange–yellow tints, while greens and purples are statistically rarer.
    
- **Contrast**: At large angular distances, dominant hues in nature are most frequently separated by approximately 180°, indicating that natural environments are characterized by strong color contrasts.
    
- **Aesthetic alignment**: Human preferences for harmonious color pairings and individual hues strikingly match these environmental distributions.

---

The research materials describe several specialized computational architectures designed to represent, process, or control colour information more effectively than standard models. These range from quantum computing frameworks to deep learning networks with geometric priors.

### Quantum HSL model

The **Quantum HSL** (QHSL) model is a quantum image representation architecture developed for quantum image processing. It captures, manipulates, and recovers images by leveraging the quantum mechanical properties of entanglement and parallelism.

- **Data encoding**: Hue and saturation are encoded as the amplitude angles of a single qubit, while lightness is stored as a sequence of qubits.
    
- **Functional applications**: This architecture enables efficient chromatic transformations, data storage, and pseudocolour applications within quantum computing hardware.
    
- **Perceptual relevance**: The model is structured around triple perceptually relevant components—hue, saturation, and lightness—to facilitate applications in computer vision and image analysis.
    

### Hypertoroidal color equivariant network

The **Hypertoroidal Color Equivariant Network** ($\mathbb{T}^{3}CEN$) is a neural network architecture designed to solve the problem of performance degradation when input colour distributions shift.

- **Geometric lifting**: To achieve perfect equivariance, the network lifts interval-valued quantities like saturation and luminance onto a circle, creating a "double-cover" representation.
    
- **Equivariant operations**: It models hue variations as two-dimensional rotations and treats saturation and luminance as circular mappings rather than one-dimensional translations.
    
- **Robustness and interpretability**: This approach resolves the approximation artifacts found in previous methods, improving the model's generalisability and predictive performance in tasks such as medical imaging and fine-grained classification.
    

### Latent color subspace in generative models

Research into high-dimensional text-to-image models has identified a **Latent Color Subspace** (LCS) within the Variational Autoencoder (VAE) latent space of the **FLUX.1** model.

- **Emergent structure**: The LCS is a three-dimensional subspace that mechanistically reflects the geometry of hue, saturation, and lightness (HSL).
    
- **Mechanistic control**: The identification of this subspace allows for the explicit prediction and control of colour during image generation without additional training.
    
- **Training-free manipulation**: Using closed-form latent-space manipulation, researchers can intervene in the generative process to ensure precise colour accuracy.
    

### Sparse coding and local competition

A **sparse coding generative model** provides a framework for understanding how the brain might represent the statistics of natural scenes to derive unique hues.

- **Locally Competitive Algorithm**: The model utilizes a non-negative variant of the **Locally Competitive Algorithm** (LCA) to evolve subthreshold variables and determine sparse coefficients.
    
- **Basis vector convergence**: When trained on natural image data, a model with six basis vectors naturally converges to directions aligning with red, green, blue, yellow, black, and white.
    
- **Inhibitory and excitatory interactions**: The nonlinear inference dynamics in the LCA lead to inhibitory interactions between similar basis vectors (like yellow and green) and excitatory interactions that allow for the encoding of intermediate hues.
    
- **Non-orthogonal mapping**: These learned color-opponent axes are non-orthogonal and are not aligned with standard cone-opponent axes, yet they provide an even and complete tiling of the chromatic plane.

---

The research materials present a comparative evaluation of color models across several domains, including human psychological perception, statistical efficiency in representing natural scenes, and performance in advanced neural networks.

### Comparison of common color spaces

A primary comparative study evaluated the alignment of various color models—including **RGB**, **HSV**, **HSL**, **XYZ**, **CIELAB**, and **CIELUV**—with human visual perception through surveys and palette extraction tasks.

- **HSL and HSV**: These cylindrical models were found to be the most effective at representing how humans perceive color. HSL demonstrated the highest correlation with human perception (0.72), followed by HSV (0.60).
    
- **RGB Model**: While standard in computer graphics, RGB is considered one of the least effective for human-centric tasks due to the high correlation between its components and light intensity . It showed a very low correlation (0.18) with perceptual judgment.
    
- **XYZ and LUV Models**: The XYZ model showed a moderate positive correlation (0.24), while CIELUV is noted for its ease of transformation and linearity, making it more effective for digital imaging than standard RGB.
    

### Performance of distance metrics and uniformity

The effectiveness of color models often depends on the accuracy of their color difference formulas.

- **CIELAB and Perceptual Uniformity**: Although CIELAB was designed to be perceptually uniform, research indicates that its standard distance formulas do not always align with human judgment.
    
- **Failed Correlations**: Unexpectedly, some advanced formulas designed for accuracy showed negative correlations with human perception in specific experimental settings, including **CIEDE2000**, **Lab CMC**, and **CMC CIE LUV**.
    
- **Palette Extraction**: In an experiment using Vincent van Gogh’s "The Starry Night," HSL produced the most "human-consistent" dominant color palette compared to other models.
    

### Statistical and neural representation efficiency

Beyond classical models, research compared different ways of representing color for computational efficiency and robustness.

- **Sparse Coding vs. Cone-Opponent Bases**: A study comparing different 6-vector bases for representing natural color statistics found that an "Adapted" basis—which aligns with the unique hues of red, green, blue, and yellow—is significantly more efficient than a cardinal cone-opponent basis. The Adapted basis consistently achieved lower Mean Squared Error (MSE) and greater sparsity (higher efficiency) than the alternatives.
    
- **Hypertoroidal Equivariance**: The **Hypertoroidal Color Equivariant Network** ($\mathbb{T}^3CEN$) was shown to be more effective than conventional architectures like **ResNet50** when input color distributions shift. By lifting color values to circular manifolds, it achieves "perfect color equivariance" and superior predictive performance in medical imaging and classification tasks.
    
- **Latent Color Subspace (LCS)**: In the context of generative models, a 3D subspace mirroring HSL geometry was found to be more effective for "precise and reliable" color control in the **FLUX.1** model than standard prompt-based methods.
    

### Specialized architectures

- **Quantum HSL (QHSL)**: This model is proposed as an efficient representation for quantum computers, allowing for chromatic transformations and image storage that take advantage of quantum entanglement and parallelism.
    
- **Hue Dependence**: Research into color harmony indicates that human preferences are highly dependent on specific hues, challenging the effectiveness of harmony theories that assume "hue independence" (where preference is based only on the distance between colors on a wheel) .

---

The research materials explore the deep connection between **color harmony and natural statistics**, suggesting that human aesthetic preferences are an evolutionary adaptation to the regularities of the environment.

### Ecological correspondence of hue preferences

Quantitative analysis of color pairing preferences reveals that harmony is highly dependent on specific hues rather than solely on the angular distance between colors. Key findings include:

- **Combinability and appeal**: A "combinability index", representing a color's ability to form harmonious pairings, aligns closely with absolute aesthetic preferences for individual colors.
    
- **Preference peaks**: Humans consistently favour blue and orange–yellow tints, while greens and purples are frequently perceived as less harmonious.
    
- **Landscape matching**: These preference patterns match the distribution of hues found in natural landscapes, where blue (sky and water) and orange–yellow (earth and sunlight) are dominant, and greens or purples are statistically rarer.
    

### Statistical regularities in natural scenes

Research into the statistics of natural scenes demonstrates that the fundamental structure of human color phenomenology emerges from environmental properties.

- **Non-Gaussian distributions**: Analysis of simulated cone responses from over 503 calibrated natural images reveals that color distributions are highly non-Gaussian. "Heavy tails" in the distribution indicate that saturated colors occur far more frequently than would be expected by chance.
    
- **Emergence of unique hues**: When a sparse coding model is adapted to these natural statistics, it converges to the four "unique hues"—red, green, blue, and yellow—plus black and white.
    
- **Environmental drivers**: These statistical peaks in the chromatic plane are driven by the presence of saturated, chromatically consistent objects such as sky, foliage, and fruit.
    

### Global preference for contrast

The materials identify a robust preference for color combinations in the contrast region, typically those separated by approximately 180°.

- **Natural contrast**: This preference for complementary hues mirrors the structure of natural environments, which are largely characterised by strong color contrasts.
    
- **Opponent exclusivity**: The nonlinear nature of sparse coding inference naturally enforces mutual exclusivity between opponent colors (e.g., red–green and blue–yellow), reflecting the organization of human color experience.
    
- **Hue groups**: Principal component analysis reveals that the hue wheel is divided into two main groups: one spanning orange to cyan and another spanning blue to dark orange. Colors from one group tend to combine harmoniously with those from the other.

---

The **unique hues**—red, green, blue, and yellow—are subjective colour experiences that appear "pure" and are not perceived as combinations of other colours. While these hues serve as a canonical basis for describing colour appearance in psychology and technology, their anatomical and physiological correlates in the brain have long remained a mystery. Research indicates that the existence of these hues is directly linked to the statistical structure of the natural visual environment.

### Natural scene statistics and heavy tails

The emergence of unique hues is grounded in the joint activations of long-, medium-, and short-wavelength (LMS) cones in response to natural scenes.

- **Anisotropic distribution**: analysis of over 225 million pixels from 503 calibrated natural images reveals that the LMS activation distribution is strongly non-Gaussian.
    
- **Heavy-tailed structure**: while most activations cluster near the achromatic (lightness) axis, saturated colours occur with far greater frequency than a random Gaussian process would predict.
    
- **Directional peaks**: these "heavy tails" extend in distinct, asymmetrically arranged directions within the 3D colour space.
    
- **Environmental drivers**: these statistical regularities are likely driven by chromatically consistent natural objects such as sky, foliage, and fruit.
    

### Sparse coding and basis convergence

To understand how the brain might represent these higher-order statistics, researchers adapted a sparse coding generative model to the natural image data.

- **Model objective**: the model seeks to represent any data point by scaling unit-norm basis vectors while minimising the total sum of coefficients (sparsity).
    
- **Six-vector convergence**: a model with six basis vectors naturally converges to directions that align with the four unique hues in addition to black and white.
    
- **Perceptual alignment**: the resulting arrangement—vectors aligned to red, green, blue, and yellow—forms a strong correspondence with human phenomenology.
    
- **Persistency**: this general motif of basis vector alignment survives across different datasets and camera types, suggesting it is a persistent property of the natural environment.
    

### Mechanics of colour opponency

The nonlinear nature of inference in the sparse coding model provides a mathematical account for why certain colours appear as opposites.

- **Inhibitory interactions**: positive entries in the Gram matrix (measuring overlap between basis vectors) lead to inhibitory interactions where activity in one latent variable suppresses another.
    
- **Mutual exclusivity**: these interactions, combined with the sparsity penalty, enforce mutual exclusivity between opponent pairs such as red–green and blue–yellow.
    
- **Excitatory interactions**: conversely, negative entries in the Gram matrix facilitate excitatory interactions between adjacent unique hues, allowing them to be combined to encode intermediate colours.
    
- **Phenomenological mapping**: because the model forms three mutually exclusive pairs, it recovers a perceptually meaningful 3D space reflecting the organization of human colour experience.

---

The research materials detail several specialised computational architectures designed to represent, process, or control colour information more effectively than standard models. These range from quantum computing frameworks to deep learning networks with geometric priors.

### Quantum colour models

The **Quantum HSL** (QHSL) model is a quantum image representation architecture developed for quantum image processing. It captures, manipulates, and recovers images by leveraging the quantum mechanical properties of entanglement and parallelism.

- **Data encoding**: hue and saturation are encoded as the amplitude angles of a single qubit, while lightness is stored as a sequence of qubits.
    
- **Functional applications**: this architecture enables efficient chromatic transformations, data storage, and pseudocolour applications within quantum computing hardware.
    
- **Perceptual relevance**: the model is structured around triple perceptually relevant components—hue, saturation, and lightness—to facilitate applications in computer vision and image analysis.
    

### Hypertoroidal equivariant networks

The **Hypertoroidal Color Equivariant Network** ($\mathbb{T}^{3}CEN$) is a neural network architecture designed to solve the problem of performance degradation when input colour distributions shift.

- **Geometric lifting**: to achieve perfect equivariance, the network lifts interval-valued quantities like saturation and luminance onto a circle, creating a "double-cover" representation.
    
- **Equivariant operations**: it models hue variations as two-dimensional rotations and treats saturation and luminance as circular mappings rather than one-dimensional translations.
    
- **Robustness and interpretability**: this approach resolves the approximation artifacts found in previous methods, improving the model's generalisability and predictive performance in tasks such as medical imaging and fine-grained classification.
    

### Latent colour subspaces in generative models

Research into high-dimensional text-to-image models has identified a **Latent Color Subspace** (LCS) within the Variational Autoencoder (VAE) latent space of the **FLUX.1** model.

- **Emergent structure**: the LCS is a three-dimensional subspace that mechanistically reflects the geometry of hue, saturation, and lightness (HSL).
    
- **Mechanistic control**: the identification of this subspace allows for the explicit prediction and control of colour during image generation without additional training.
    
- **Training-free manipulation**: using closed-form latent-space manipulation, researchers can intervene in the generative process to ensure precise colour accuracy.
    

### Sparse coding and local competition

A **sparse coding generative model** provides a framework for understanding how the brain might represent the statistics of natural scenes to derive unique hues.

- **Locally Competitive Algorithm**: the model utilises a non-negative variant of the **Locally Competitive Algorithm** (LCA) to evolve subthreshold variables and determine sparse coefficients.
    
- **Basis vector convergence**: when trained on natural image data, a model with six basis vectors naturally converges to directions aligning with red, green, blue, yellow, black, and white.
    
- **Inhibitory and excitatory interactions**: the nonlinear inference dynamics in the LCA lead to inhibitory interactions between similar basis vectors and excitatory interactions that allow for the encoding of intermediate hues.
    

While these materials provide advanced frameworks, it should be noted that they represent a specific subset of colour research. Other alternative, perceptually uniform colour spaces such as **CIELAB** and **OKLAB** also offer robust platforms for image processing, though they involve more complex multi-component interactions for defining hue.

---

The research materials detail a variety of datasets and sampling methodologies used to investigate colour perception, harmony, and computational modelling. These include large-scale image databases, hyperspectral datasets, and human surveys.

### Natural image and hyperspectral datasets

Several studies utilise extensive collections of natural imagery to analyse the statistical distribution of colours in the environment.

- **Composite LMS dataset**: a large dataset was constructed by combining five calibrated and hyperspectral sources to produce over 225 million simulated cone activations from 503 images.
    
- **Constituent sources**: the composite data included 62 images from the Kyoto natural image dataset (Japan), 237 images from the Barcelona calibrated database (Spain), 12 hyperspectral images from Ruderman et al. (United States and Australia), 165 from the 2022 NTIRE spectral recovery challenge (Israel), and 27 from Foster and Reeves (Portugal).
    
- **Naturalistic constraints**: researchers excluded images containing man-made objects to ensure the results were not confounded by human perceptual biases inherited by those objects.
    
- **Landscape databases**: for studying colour harmony, a dataset of 12,000 landscape images spanning biomes such as forests, glaciers, and mountains was used.
    
- **Robustness testing**: the findings from the 12,000-image set were verified using an independent dataset of 4,319 landscape pictures.
    

### Human survey sampling

To align computational models with human experience, various participant panels were recruited for perceptual surveys.

- **Harmony survey**: a large-scale study collected 346 responses from participants at institutions such as École Polytechnique (France) and OIST (Japan), as well as volunteers across Europe.
    
- **Demographics**: this panel included both male and female participants aged between 20 and 65.
    
- **Perceptual difference study**: a smaller survey involved 15 participants (seven males and eight females) aged 20–23 years old to evaluate perceived differences between colour pairs.
    
- **Hue sampling**: in the HSL colour space, 18 equally spaced hues were initially sampled at 20° intervals; five were removed due to lack of perceptual uniformity, leaving 13 distinguishable colours for the study.
    

### Medical and computational datasets

Specific datasets were employed for testing advanced neural networks and generative models.

- **Camelyon17**: this dataset consists of Whole-Slide Images of Hematoxylin and Eosin stained lymph node sections from 100 patients.
    
- **Training and testing split**: the Camelyon17 data was split into 50 patient slides for training and 50 for testing, with images originating from five different hospitals.
    
- **Generative latent space**: research into the **FLUX.1** [Dev] text-to-image model analysed its Variational Autoencoder latent space to identify emergent colour structures.
    

### Preprocessing and calibration

The materials describe rigorous steps to prepare raw data for analysis.

- **Nonlinear transformation**: cone absorbances were transformed into nonlinear responses using an exponential saturation function to produce an approximately uniform distribution.
    
- **Adaptation**: the processing effectively applied von Kries adaptation, where each cone type's response was rescaled independently based on its mean.
    
- **Redundancy reduction**: principal component analysis was used to decorrelate and rescale data, creating a "sphered colour space" with unit variance in all directions.
    
- **Zero-centering**: mean values were subtracted from each image across spatial and channel dimensions to ensure the entire dataset was zero-centered prior to further processing.

---

The research materials describe the **chromatic structure and heavy tails** of natural scenes as a fundamental statistical regularity that shapes human color perception. This structure is observed when analyzing the joint activations of long-, medium-, and short-wavelength (LMS) cones in response to the natural environment.

### Statistical Distribution in Color Space

Analysis of over 225 million simulated cone activations reveals that the color distribution in natural scenes is strongly non-Gaussian. While the achromatic (lightness) dimension shows a mild sub-Gaussian shape, the chromatically sensitive dimensions—specifically the L–M and 2S–(L+M) axes—exhibit a pronounced heavy-tailed structure.

### Characteristics of Heavy Tails

The "heavy tails" in the distribution indicate that saturated colors occur much more frequently than would be expected from a random Gaussian process with the same variance.

- **Kurtosis measurements**: The excess kurtosis, which quantifies the "tailedness" of a distribution, is 27.0 for the L–M axis and 4.3 for the 2S–(L+M) axis.
    
- **Asymmetry**: The tails are not uniform in all directions; for instance, there is more probability mass in the positive L–M direction than in the negative.
    
- **Persistence**: This heavy-tailed structure is a persistent property of the natural world, appearing consistently across various datasets collected by different researchers using different cameras.
    

### Ecological and Computational Significance

The existence of these statistical regularities is attributed to the presence of highly saturated, chromatically consistent objects in nature, such as sky, foliage, and fruit. Independent analysis of landscape imagery confirms this non-uniform distribution, showing major peaks for blue and orange-yellow tints and valleys for greens and purples.

From a computational perspective, the heavy tails are critical for efficient coding:

- **Sparse coding alignment**: Sparse coding models adapted to natural scene statistics have basis vectors that align specifically with these high-kurtosis (heavy-tailed) directions.
    
- **Emergence of unique hues**: The alignment of these basis vectors explains the emergence of the four "unique hues"—red, green, blue, and yellow—as they represent the most efficient way to tile the non-Gaussian distribution of colors found in the natural environment.

---

The **distributional characteristics of colour** in the natural environment and specific datasets exhibit highly structured, non-Gaussian patterns that differ significantly from random distributions.

### LMS activation space

Analysis of more than 225 million simulated cone activations from natural images reveals a distinct three-dimensional structure in long-, medium-, and short-wavelength (LMS) space.

- The distribution is characterised by a strong anisotropy: the variance along the first principal component (achromatic channel) is more than 10-fold greater than along the second principal component.
    
- There is an even greater difference in variance between the second and third principal components.
    
- To visualise the structure, researchers often equalise the variance in all directions to create a sphered colour space.
    

### Non-Gaussian structure and heavy tails

The distribution of LMS activations deviates significantly from a standard Gaussian process.

- The achromatic dimension (L+M+S) is mildly sub-Gaussian, with a negative excess kurtosis of –0.6.
    
- Conversely, chromatically sensitive dimensions show "heavy-tailed" structure, meaning saturated colours occur more frequently than expected by chance.
    
- Specific excess kurtosis values for these tails are 4.3 for the 2S–(L+M) direction and 27.0 for the L–M direction.
    
- These heavy tails are asymmetrically arranged, with greater probability mass in the positive L–M direction and negative 2S–(L+M) direction.
    
- This structure is persistent across diverse datasets and camera types, suggesting it is a fundamental property of the natural world.
    

### Landscape hue statistics

Statistical analysis of 12,000 natural landscape images provides a detailed view of hue distributions.

- Hue distributions are not uniform: peaks occur for blue and orange–yellow tints, while valleys are found in the green and purple regions.
    
- At large angular distances, dominant hues in natural scenes are most frequently separated by approximately 180°.
    
- This implies that natural environments are largely characterised by strong colour contrasts.
    

### Medical image characteristics

In specialised datasets like **Camelyon17**, which contains images of lymph node sections, colour distributions are influenced by staining and hospital source: these images show specific saturation distributions that vary across different hospitals (hospitals one–five). Conventional neural networks often experience performance drops when these distributions shift between training and inference.

---

**Chromatic structure and heavy tails** refer to the non-Gaussian distributional patterns observed in the joint activations of long–, medium–, and short–wavelength selective (LMS) cones when exposed to natural scenes. While the majority of pixel activations in natural imagery cluster near the achromatic axis, large–scale analysis of over 225 million pixels reveals a rich structure where saturated colours occur with far greater frequency than expected from a random Gaussian process.

### Distributional characteristics in colour space

The distribution of colour signals in the natural environment is characterised by a strong anisotropy.

- The variance along the achromatic channel is more than 10–fold greater than that along chromatic channels.
    
- In the chromatically sensitive dimensions, specifically the L–M and 2S–(L+M) axes, the data exhibit a strong heavy–tailed structure.
    
- This structure is defined by isoprobability contours that extend significantly farther from the origin than those of a standard Gaussian distribution.
    
- The excess kurtosis for one–dimensional projections along these chromatic directions is 4.3 for 2S–(L+M) and 27.0 for L–M.
    

### Asymmetry and directional peaks

The heavy–tailed nature of the chromatic distribution is not uniform but varies according to direction and azimuth angle.

- The tails are markedly asymmetric; for instance, there is greater probability mass in the extremes of the positive L–M direction than in the negative.
    
- Pronounced heavy tails are observed in specific directions, such as 0° and 260° within the chromatic plane.
    
- In contrast, other directions, such as 135°, exhibit tails that are more Gaussian or even sub–Gaussian in nature.
    
- This directional structure remains a persistent property of the natural environment across various datasets collected by different investigators using different equipment.
    

### Environmental drivers

The presence of heavy tails in chromatic statistics is hypothesised to be a consequence of the material properties of objects found in natural scenes.

- Surface colour is a material property that tends to remain coherent within an object.
    
- Highly saturated and chromatically consistent natural objects—such as flora, foliage, sky, and fruit—are believed to drive these statistical peaks.
    
- These regularities provide a statistical basis that the visual system appears to exploit through mechanisms like sparse coding, which naturally aligns its basis vectors with these heavy–tailed directions to derive unique hues.

---

The research materials provide a detailed analysis of **landscape hue statistics** derived from large-scale image datasets, revealing how the distribution of colours in the environment aligns with human aesthetic preferences and biological vision.

### Dataset and methodology

Researchers analysed a primary dataset of 12,000 landscape images collected from Kaggle.

- The images span various natural biomes: coasts, deserts, forests, glaciers, and mountains.
    
- To ensure the findings were not confounded by human design, images containing man–made objects were excluded from the analysis.
    
- The count of hue occurrences was measured by sampling pixels and identifying dominant tints.
    
- These findings were validated against an independent dataset of 4,319 landscape images, which yielded virtually identical results.
    

### Distributional characteristics

The statistical analysis of natural scenes identifies several persistent regularities in how hues are distributed:

- **Frequency peaks**: the distribution of hues is highly non–uniform, with significant peaks occurring for blue and orange–yellow tints.
    
- **Frequency valleys**: green and purple hues are statistically rarer in these datasets, forming the valleys of the distribution.
    
- **Hue contrast**: dominant hues in natural scenes are most frequently separated by an angular distance of approximately 180° on the hue wheel.
    
- **Environmental characteristics**: this 180° separation suggests that natural environments are largely characterised by strong colour contrasts.
    

### Correspondence with human perception

A central finding is the striking alignment between these environmental statistics and human psychology:

- **Aesthetic appeal**: the peaks and valleys of hue distribution match the Combinability index—a measure of how well a colour pairs with others—and absolute human colour preferences.
    
- **Ecological valence**: human preferences for blue and yellow–orange tints correspond to the most frequently occurring hues in nature (e.g., sky and sunlight), whereas the less preferred green and purple are rarer configurations in natural landscapes.
    
- **Repeated exposure**: the correlation suggests that aesthetic appeal may be shaped by repeated exposure to common visual patterns in the environment.
    

### Higher-order statistics and unique hues

Further investigation into the statistics of 503 calibrated natural images reveals more complex structures beyond simple hue frequency:

- **Heavy tails**: analysis of cone responses shows a non–Gaussian distribution with "heavy tails" in specific directions.
    
- **Persistent properties**: these tails extended in distinct, asymmetrically arranged directions and are a persistent property of the natural environment across different datasets.
    
- **Biological convergence**: a sparse coding model trained on these statistics naturally converges to the four "unique hues"—red, green, blue, and yellow—plus black and white.
    
- **Spatiochromatic structure**: these statistics are driven by highly saturated, chromatically consistent objects such as foliage, sky, and fruit.
    

While these datasets are extensive, they represent a fragment of the global visual environment; further research across more diverse geographic and seasonal contexts could refine these statistical models.

---

The **Quantum HSL (QHSL)** model is a specialized quantum image representation framework described in the research materials. It is designed to capture, manipulate, and recover digital images using the principles of quantum mechanics, specifically targeting applications in computer vision and image analysis.

### Core Architecture and Encoding

The QHSL model organizes color information into three perceptually relevant components: **Hue (H)**, **Saturation (S)**, and **Lightness (L)**. Unlike classical HSL models, QHSL utilizes quantum properties like entanglement and parallelism to represent this data:

- **Hue and Saturation:** These chromatic attributes are encoded as the probability amplitude angles of a single qubit. Specifically, the hue and saturation values are mapped to the state parameters of the qubit, allowing these two properties to be stored and processed within a highly compact quantum state.
    
- **Lightness:** The lightness component is stored as a sequence of qubits (a qubit string), representing the intensity or brightness level of the pixel.
    
- **Spatial Information:** The 2D coordinates of each pixel in the image are also encoded into a quantum state, typically using a sequence of qubits to represent the row and column indices.
    

### Key Objectives and Advantages

The primary motivation for the QHSL model is to bridge the gap between quantum computing and human-centric color perception. The research highlights several advantages of this approach:

1. **Perceptual Relevance:** By using HSL instead of the standard RGB (Red, Green, Blue) format, the model aligns more closely with how humans describe and distinguish colors. This makes it more suitable for high-level tasks like edge detection and object recognition.
    
2. **Efficiency in Transformation:** The representation allows for "chromatic transformations" (such as shifting hue or adjusting saturation) to be performed efficiently across the entire image simultaneously through quantum parallelism.
    
3. **Data Storage:** The model leverages quantum entanglement to maintain the relationship between the spatial coordinates of a pixel and its HSL color values, enabling a dense representation of image data.
    

### Practical Applications

The research explores several functional applications for the QHSL model within quantum computing environments:

- **Data Storage and Recovery:** Methods for preparing a quantum state to represent a classical image and subsequently measuring that state to recover the image.
    
- **Pseudocolor Processing:** Using quantum circuits to transform grayscale images into colorized versions for better visual analysis.
    
- **Image Analysis:** The model serves as a foundation for more complex quantum computer vision algorithms, such as those used for feature extraction or medical image classification.
    

In summary, QHSL represents an advancement in quantum image processing by providing a mathematically robust way to handle color that is both computationally efficient for quantum hardware and intuitive for human-centric applications.

---

The **Hypertoroidal color equivariant network** ($\mathbb{T}^{3}CEN$) is a specialized neural network architecture designed to maintain predictive accuracy when the color distribution of input images changes. Conventional convolutional neural networks (CNNs) often experience significant performance drops when faced with such "out-of-distribution" color variations, but $\mathbb{T}^{3}CEN$ achieves robustness by incorporating geometric priors of color directly into its design.

### Architectural framework and lifting mechanism

The primary innovation of $\mathbb{T}^{3}CEN$ is its "hypertoroidal" approach to equivariance, which allows the network to process color shifts in a mathematically consistent way.

- **Lifting interval-valued quantities:** While hue is naturally cyclic (modeled as a circle), saturation and luminance are interval-valued quantities restricted to a bounded range. Previous models approximated these as translations on a real line, which introduced artifacts.
    
- **Double-cover lifting:** $\mathbb{T}^{3}CEN$ instead "lifts" saturation and luminance values from their bounded intervals onto a circle (a double-cover). This gives these attributes cyclic behavior, allowing them to be treated as groups.
    
- **HSL group convolution:** The network maps input images to a feature map on the HSL group ($H_N \times S_M \times L_R$) and performs convolutions across this space. This ensures that if an input image undergoes a color shift, its internal feature representations are simply permuted in a predictable, cyclic manner.
    

### Experimental results and performance

The architecture demonstrates superior performance across synthetic and real-world datasets compared to conventional and other equivariant baselines:

- **Equivariance error:** $\mathbb{T}^{3}CEN$ achieved a saturation equivariance error of $4.66 \times 10^{-6}$, which is six orders of magnitude lower than the error recorded for the LCER baseline ($0.445$).
    
- **Out-of-distribution generalization:** In classification tasks involving hue, saturation, and luminance shifts (using the 3D Shapes and small NORB datasets), $\mathbb{T}^{3}CEN$ consistently outperformed ResNet and CEConv. It was the only model to achieve perfect classification accuracy on HSL-shifted variations of the 3D Shapes dataset.
    
- **Medical imaging:** The network was tested on the Camelyon17 histopathology dataset, where it proved robust to color imbalances caused by varying data collection and staining procedures across different hospitals.
    

### Extended applications and limitations

Research into the double-cover lifting layer shows it has utility beyond the HSL color space:

- **Versatility:** The lifting mechanism can be adapted to build color equivariant architectures in the RGB space and scale-equivariant architectures for handling variations in image resolution.
    
- **Computational complexity:** The main limitation of the approach is its computational expense. Like other group equivariant networks, it requires more resources than standard CNNs because it must process a filter orbit to approximate a continuous group.

---

Research into the internal mechanisms of the **FLUX.1 [Dev]** text-to-image model has identified a three-dimensional region within its high-dimensional Variational Autoencoder (VAE) latent space known as the **Latent Color Subspace** (LCS). This subspace provides a mechanistic interpretation of how the model encodes colour information, revealing an emergent order that mirrors human-centric colour representations.

### Geometry of the Latent Color Subspace

The LCS was discovered by applying principal component analysis (PCA) to latent vectors produced by encoding solid-colour images. The analysis revealed that three principal components (PCs) account for 100% of the variance in colour information, forming a well-organised bicone structure.

- **Lightness axis**: the first principal component (PC1) spans from light to dark.
    
- **Hue circle**: the second and third components (PC2 and PC3) jointly form a circular structure representing hue.
    
- **Saturation radius**: the distance of a point from the central lightness axis (PC1) encodes its saturation level.
    

This geometric arrangement essentially recovers the **HSL** (Hue, Saturation, Lightness) colour model within the generative latent space.

### Temporal evolution and observation

During the Flow Matching (FM) generation process, latent patches do not jump immediately to their final colours. Instead, they follow predictable trajectories within the LCS:

- **Initial state**: patches begin as a centered, colour-mixed Gaussian distribution near mid-grey.
    
- **Progression**: as timesteps progress, the patches gradually move outward toward their final positions in the HSL-like bicone.
    
- **Mid-generation observation**: by projecting intermediate latents into the LCS and rescaling them based on time-dependent statistics, researchers can accurately predict final image colours without using the computationally expensive VAE decoder.
    

### Training-free colour intervention

The identification of the LCS enables precise, training-free control over the generative process through closed-form latent-space manipulation.

- **Intervention strategies**: two types of manipulation were developed. Type I involves a direct translation in the LCS, while Type II shifts patches within the decoded HSL space. An interpolation of these two methods is most effective for preserving fine-grained texture.
    
- **Object-localized control**: by combining LCS manipulation with segmentation maps derived from text-image cross-attention, the system can target specific objects for colour changes while leaving the rest of the image untouched.
    
- **Performance advantages**: this mechanistic approach achieves higher colour precision (particularly in hue) than standard prompting. Furthermore, it preserves the original image's high-level structure more faithfully than modifying the text prompt, which often causes the entire scene to be re-generated.

---

**Sparse coding** is a linear generative modelling strategy used to capture higher–order structure in three–dimensional (3D) colour space that standard methods like principal component analysis (PCA) cannot resolve. While PCA decorrelates variables based on second–order statistics, sparse coding identifies directions of high kurtosis—such as the "heavy tails" observed in natural scene statistics—to define a set of basis vectors.

### Sparse coding generative model

In this framework, a 3D data vector $x$ is described as a linear combination of $m$ unit–norm basis vectors $a_i$ scaled by latent variables $s_i$:

$x = \sum_{i=1}^{m} a_i s_i + \mathcal{E}$. The model enforces sparsity in the latent variables, encouraging their values to be zero through a factorial prior. A nonnegativity constraint ($s_i \ge 0$) is typically imposed to account for the asymmetric structure evident in chromatic data. These variables are determined by minimising an energy function $E$ that balances reconstruction quality with a sparsity penalty controlled by a parameter $\lambda$.

### Locally Competitive Algorithm (LCA)

The optimisation problem of inferring these latent variables is solved using a nonnegative variant of the **Locally Competitive Algorithm**.

- **Internal dynamics**: LCA evolves subthreshold variables $u_i$ over time.
    
- **Competition**: the evolution of each variable is driven by the projection of the input onto the basis vector ($a_i^T x$) while being suppressed by a weighted sum of other active latent variables.
    
- **Thresholding**: the sparse coefficients $s_j$ are generated by applying a rectifying nonlinearity to the subthreshold variables: $s_j = \max(0, u_i - \lambda)$.
    

### Interactions via the Gram matrix

The competition between latent variables during inference is mediated by the **Gram matrix**, which contains the inner products between basis vectors ($G_{ij} = a_i^T a_j$).

- **Inhibitory interactions**: positive entries in the Gram matrix indicate similarity between basis vectors. Activity in one latent variable suppresses others with similar orientations, leading to curved iso–response contours that bend away from one another.
    
- **Excitatory interactions**: negative entries in the Gram matrix result in excitatory interactions. This allows basis vectors to be recruited even for regions of the input space where they have a negative projection, ensuring an even and complete tiling of the chromatic plane.
    

### Emergence of mutual exclusivity

The combination of sparsity and local competition leads to the emergence of mutual exclusivity between opponent colour units.

- **Opponent pairs**: although opponent pairs (such as red–green or blue–yellow) are not necessarily orthogonal or collinear, the LCA ensures their response contours do not overlap.
    
- **Sparsity constraint**: while opponent basis vectors may have large negative inner products—which would otherwise suggest excitation—they remain mutually exclusive because simultaneous activation would decrease the overall sparsity of the representation.
    
- **Unique hues**: in a model with six basis vectors, this process results in three pairs of mutually exclusive latent variables, recovering the phenomenological organisation of unique hues. This structure is unique to the six–vector model; for instance, the four–vector model contains no opponent pairs, while the seven–vector model introduces deviations where one hue may be opponent to multiple others.
