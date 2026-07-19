import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecipeById, saveRecipe, currentUser } from '../../../shared/api/data';
import { showToast } from '../../../shared/lib/utils';

export function useRecipeForm(id, prefill) {
  const navigate = useNavigate();
  const isEdit = !!id;

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: prefill?.title || '',
    category: prefill?.category || 'Autres',
    author: prefill?.author || '',
    description: prefill?.description || '',
    imageUrl: prefill?.imageUrl || '',
    sourceUrl: prefill?.sourceUrl || '',
    prepTime: prefill?.prepTime || '',
    cookTime: prefill?.cookTime || '',
    servings: prefill?.servings || '',
    servingsUnit: prefill?.servingsUnit || 'personnes',
    ingredients: prefill?.ingredients?.length ? prefill.ingredients : [''],
    steps: prefill?.steps?.length ? prefill.steps : ['']
  });

  useEffect(() => {
    if (isEdit) {
      getRecipeById(id).then(recipe => {
        if (recipe) {
          setFormData({
            title: recipe.title || '',
            category: recipe.category || 'Autres',
            author: recipe.author || '',
            description: recipe.description || '',
            imageUrl: recipe.imageUrl || '',
            sourceUrl: recipe.sourceUrl || '',
            prepTime: recipe.prepTime || '',
            cookTime: recipe.cookTime || '',
            servings: recipe.servings || '',
            servingsUnit: recipe.servingsUnit || 'personnes',
            ingredients: recipe.ingredients?.length ? recipe.ingredients : [''],
            steps: recipe.steps?.length ? recipe.steps : ['']
          });
        }
        setIsLoading(false);
      });
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDynamicChange = (type, index, value) => {
    setFormData(prev => {
      const newList = [...prev[type]];
      newList[index] = value;
      return { ...prev, [type]: newList };
    });
  };

  const addDynamicItem = (type) => {
    setFormData(prev => ({ ...prev, [type]: [...prev[type], ''] }));
  };

  const removeDynamicItem = (type, index) => {
    setFormData(prev => {
      const newList = [...prev[type]];
      if (newList.length > 1) {
        newList.splice(index, 1);
      } else {
        newList[0] = '';
      }
      return { ...prev, [type]: newList };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast("Vous devez être connecté pour sauvegarder une recette.", "error");
      return;
    }

    if (!formData.title.trim()) {
      showToast("Le titre est obligatoire.", "error");
      return;
    }

    setIsSaving(true);

    const recipe = {
      ...(isEdit ? { id } : {}),
      title: formData.title.trim(),
      category: formData.category,
      author: formData.author.trim(),
      description: formData.description.trim(),
      imageUrl: formData.imageUrl.trim(),
      sourceUrl: formData.sourceUrl.trim(),
      prepTime: parseInt(formData.prepTime) || 0,
      cookTime: parseInt(formData.cookTime) || 0,
      servings: parseFloat(formData.servings) || 0,
      servingsUnit: formData.servingsUnit,
      ingredients: formData.ingredients.map(i => i.trim()).filter(Boolean),
      steps: formData.steps.map(s => s.trim()).filter(Boolean),
    };

    try {
      await saveRecipe(recipe);
      showToast(isEdit ? 'Recette mise à jour !' : 'Recette sauvegardée !', 'success');
      navigate('/');
    } catch (err) {
      showToast('Erreur: ' + err.message, 'error');
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/');
  };

  return {
    formData,
    isLoading,
    isSaving,
    isEdit,
    handleChange,
    handleDynamicChange,
    addDynamicItem,
    removeDynamicItem,
    handleSubmit,
    handleCancel
  };
}
